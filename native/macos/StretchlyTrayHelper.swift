import AppKit
import Foundation

final class TrayApplication: NSObject, NSApplicationDelegate {
  private var statusItem: NSStatusItem?
  private var trayMenu = NSMenu()

  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.setActivationPolicy(.accessory)
    readCommands()
  }

  private func readCommands() {
    DispatchQueue.global(qos: .userInitiated).async {
      while let line = readLine() {
        guard let data = line.data(using: .utf8),
              let command = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
          continue
        }
        DispatchQueue.main.async { [weak self] in
          self?.handle(command)
        }
      }
      DispatchQueue.main.async {
        NSApp.terminate(nil)
      }
    }
  }

  private func handle(_ command: [String: Any]) {
    switch command["type"] as? String {
    case "update":
      update(command)
    case "destroy":
      removeStatusItem()
      NSApp.terminate(nil)
    default:
      break
    }
  }

  private func update(_ command: [String: Any]) {
    if statusItem == nil {
      statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    }

    guard let statusItem, let button = statusItem.button else { return }
    button.target = self
    button.action = #selector(statusItemSelected(_:))
    button.sendAction(on: [.leftMouseUp, .rightMouseUp])

    if let iconPath = command["iconPath"] as? String,
       let image = NSImage(contentsOfFile: iconPath) {
      image.size = NSSize(width: 16, height: 16)
      image.isTemplate = command["template"] as? Bool ?? false
      button.image = image
      button.imagePosition = .imageOnly
    }

    button.toolTip = command["toolTip"] as? String
    if let menuItems = command["menu"] as? [[String: Any]] {
      trayMenu = buildMenu(menuItems)
    }
  }

  @objc private func statusItemSelected(_ sender: NSStatusBarButton) {
    if NSApp.currentEvent?.clickCount == 2 {
      emit(["type": "double-click"])
      return
    }
    trayMenu.popUp(positioning: nil, at: NSPoint(x: 0, y: sender.bounds.height), in: sender)
  }

  private func buildMenu(_ definitions: [[String: Any]]) -> NSMenu {
    let menu = NSMenu()
    for definition in definitions {
      if definition["type"] as? String == "separator" {
        menu.addItem(.separator())
        continue
      }

      let item = NSMenuItem(
        title: definition["label"] as? String ?? "",
        action: #selector(menuItemSelected(_:)),
        keyEquivalent: ""
      )
      item.target = self
      item.isEnabled = definition["enabled"] as? Bool ?? true
      item.representedObject = definition["id"] as? String

      if let submenu = definition["submenu"] as? [[String: Any]] {
        item.submenu = buildMenu(submenu)
      } else if item.representedObject == nil {
        item.action = nil
      }
      menu.addItem(item)
    }
    return menu
  }

  @objc private func menuItemSelected(_ sender: NSMenuItem) {
    guard let actionID = sender.representedObject as? String else { return }
    emit(["type": "action", "id": actionID])
  }

  private func emit(_ payload: [String: Any]) {
    guard let data = try? JSONSerialization.data(withJSONObject: payload),
          let line = String(data: data, encoding: .utf8) else { return }
    FileHandle.standardOutput.write(Data((line + "\n").utf8))
  }

  private func removeStatusItem() {
    if let statusItem {
      NSStatusBar.system.removeStatusItem(statusItem)
      self.statusItem = nil
    }
  }
}

let application = NSApplication.shared
let delegate = TrayApplication()
application.delegate = delegate
application.run()

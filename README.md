# Vant-Helper

**English** | [中文](./README.zh-CN.md)

> Vant-Helper is a VS Code extension for Vant-UI.

Vant-UI is a great library. More and more projects use it. So, For helping developer write more efficient by Vant-UI, Vant-Helper is born.

## Feature

* Document

* Autocomplete

	support vue, html

* Snippets


## Document

### Usage

1 - Move cursor to Vant-UI tag or select it

2 - Press default hot key `shift + cmd + z`(windows: `ctrl + shift + z`) or Press ⇧⌘P to bring up the Command Palette and then input `vant-helper.search`

3 - Show document view If complete matching,
    or you should select tag you want to search

4 - Enter and trigger document browser

![document](https://cdn.jsdelivr.net/gh/noransu/images-myown@master/noransImage/usage.3o6dy34aat80.gif)


### Version, Quotes and Language Switching

1 - Enter `Preferences` -> `setting` or shortcut `cmd` + `,`

2 - Modify language, version or quotes
```javascript
  "vant-helper.language": "zh-CN",
  "vant-helper.version": "2",
  "vant-helper.quotes": "double",    // html vue qoutes
```

### Keymap

Default hot key is  `shift + cmd + z`( windows: `ctrl + shift+ z`). If it has conflicted with other software's hot key. You can customize it. see [keybindings](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-shortcuts-editor)


## Autocomplete

![autocomplete](https://cdn.jsdelivr.net/gh/noransu/images-myown@master/noransImage/autoComplete.jvr10ydk88w.gif)

* Distinguish and auto complete property and method for every Vant-UI tag


## Snippets

![snippets](https://cdn.jsdelivr.net/gh/noransu/images-myown@master/noransImage/snippets.6kx5xqdw42s0.gif)

Support snippets list:

* `dialog`

  ```
  this.$dialog.alert({
    message: '',
  })
  ```

* `toast`

  ```
  this.$toast({
    message: '',
  })
  ```

* `notify`

  ```
  this.$notify({
    type: '',
    message: '',
  })
  ```

## Contribution

Your pull request will make Vant-Helper better.

## LICENSE

MIT

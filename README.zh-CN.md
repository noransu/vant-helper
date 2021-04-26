# Vant-Helper

**中文** | [English](./README.md)

> Vant-Helper 是一款Vant-VS Code 插件.

Vant-UI 是一款很棒的库。有非常多的项目都会使用到它，所以，为了帮助开发者更有效率地使用Vant-UI来开发，Vant-Helper诞生了

## 特征

* 文档

* 自动补全

	支持 vue, html

* 片段


## 文档

### 用法

1 - 移动指针到Vant-UI的标签并选择它

2 - 按下默认的热键`shift + cmd + z`(windows系统: `ctrl + shift + z`) 或者按下 ⇧⌘P 来打开命令主板并输入 `vant-helper.search`

3 - 当匹配到标签时会自动打开视窗显示对应的内容,
    或者查找、选择你需要的标签

4 - 回车(或点击)打开对应的视窗

![document](https://cdn.jsdelivr.net/gh/noransu/images-myown@master/noransImage/usage.3o6dy34aat80.gif)


### 版本, 引用 与语言切换

1 - 输入或选择 `Preferences` -> `setting` 或快捷键 `cmd` + `,`

2 - 修改语言，版本与引用
```javascript
  "vant-helper.language": "zh-CN",
  "vant-helper.version": "2",
  "vant-helper.quotes": "double",    // html vue qoutes
```

### 热键映射

默认的热键是  `shift + cmd + z`( windows系统: `ctrl + shift+ z`). 如果它与你的其他软件的热键冲突，你可以自己修改它，看这里 [keybindings](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-shortcuts-editor)


## 自动补全

![autocomplete](https://cdn.jsdelivr.net/gh/noransu/images-myown@master/noransImage/autoComplete.jvr10ydk88w.gif)

* 区分并自动补全Vant-UI的所有tag


## 片段

![snippets](https://cdn.jsdelivr.net/gh/noransu/images-myown@master/noransImage/snippets.6kx5xqdw42s0.gif)

支持的片段列表:

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

## 贡献

您的 pull request 将使得Vant Helper更好.

## 许可

MIT

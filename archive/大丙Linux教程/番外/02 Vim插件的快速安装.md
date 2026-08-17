---
title: "Vim插件的快速安装"
chapter: "番外"
order: 2
source: "https://subingwen.cn/linux/vimplus/"
author: "苏丙榅"
tags: [Linux, 教程, Subingwen]
type: reference
---

# Vim插件的快速安装

[[archive/大丙Linux教程/番外/index|← 返回本章目录]] · [[01 普通用户添加 sudo 权限|上一篇：普通用户添加 sudo 权限]] · [[03 CMake 保姆级教程（上）|下一篇：CMake 保姆级教程（上） →]]

> 来源：[原文：Vim插件的快速安装](https://subingwen.cn/linux/vimplus/)

Linux的文本编辑器 `vim` 功能不仅强大, 还支持安装各种插件, 但是插件的安装一直是让小伙伴们头疼的问题。下面为大家介绍一个快速安装插件的方法，这是 `github` 上的一个开源项目, 基于脚本一键安装, 下面是这个项目里 `README` 中的相关描述:

vimplus项目的github地址: [https://github.com/chxuan/vimplus](https://github.com/chxuan/vimplus)

由于防火墙原因，该插件在安装过程中需要搭梯子，否则可能会导致一些文件无法下载的情况。在本文末尾为大家同了易总这种的解决方案，没有版本控的小伙伴可以参考（其实什么版本都一样用）

## 1\. 安装

### 1.1 Mac OS X

### 安装HomeBrew

```shell
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

### 安装vimplus

```shell
git clone https://github.com/chxuan/vimplus.git ~/.vimplus
cd ~/.vimplus
./install.sh
```

### 设置Nerd Font

为防止vimplus显示乱码，需设置mac终端字体为 `Droid Sans Mono Nerd Font` 。

`注: apline用户请预先安装git,bash: apk add git bash`

### 更新vimplus

紧跟vimplus的步伐，尝鲜新特性

```shell
./update.sh
```

### 1.2 Linux 64-bit

### 支持以下发行版

![[assets/Linux教程/39-01.png|image-20240728185642008]]

### 安装vimplus

```shell
git clone https://github.com/chxuan/vimplus.git ~/.vimplus
cd ~/.vimplus
./install.sh //不加sudo
```

### 设置Nerd Font

为防止vimplus显示乱码，需设置linux终端字体为 `Droid Sans Mono Nerd Font` 。

### 多用户支持

将vimplus在某个用户下安装好后，若需要在其他用户也能够使用vimplus，则执行

```shell
sudo ./install_to_user.sh username1 username2 //替换为真实用户名
```

### 更新vimplus

紧跟vimplus的步伐，尝鲜新特性

```shell
./update.sh
```

### 1.3 Android 64-bit(Termux)

### 安装vimplus

```shell
git clone https://github.com/chxuan/vimplus.git ~/.vimplus
cd ~/.vimplus
./install.sh
```

### 更新vimplus

紧跟vimplus的步伐，尝鲜新特性

```shell
./update.sh
```

### 1.4 Docker

[ubuntu-vimplus](https://hub.docker.com/r/chxuan/ubuntu-vimplus) 是vimplus基于ubuntu18.04的docker镜像，无需安装vimplus，即可快速体验vimplus带来的快乐

```shell
docker run -it chxuan/ubuntu-vimplus
```

## 2\. 自定义

> - [~/.vimrc](https://github.com/chxuan/vimplus/blob/master/.vimrc) 为vimplus的默认配置，一般不做修改
> - [~/.vimrc.custom.plugins](https://github.com/chxuan/vimplus/blob/master/.vimrc.custom.plugins) 为用户自定义插件列表，用户增加、卸载插件请修改该文件
> - [~/.vimrc.custom.config](https://github.com/chxuan/vimplus/blob/master/.vimrc.custom.config) 为用户自定义配置文件，一般性配置请放入该文件，可覆盖 [~/.vimrc](https://github.com/chxuan/vimplus/blob/master/.vimrc) 里的配置

## 3\. 插件列表

| 插件 | 说明 |
| --- | --- |
| [cpp-mode](https://github.com/chxuan/cpp-mode) | 提供生成函数实现、函数声明/实现跳转、.h.cpp切换等功能(I’m author😄) |
| [vim-edit](https://github.com/chxuan/vim-edit) | 方便的文本编辑插件(I’m author😄) |
| [change-colorscheme](https://github.com/chxuan/change-colorscheme) | 随心所欲切换主题(I’m author😄) |
| [prepare-code](https://github.com/chxuan/prepare-code) | 新建文件时，生成预定义代码片段(I’m author😄) |
| [vim-buffer](https://github.com/chxuan/vim-buffer) | vim缓存操作(I’m author😄) |
| [vimplus-startify](https://github.com/chxuan/vimplus-startify) | vimplus开始页面(修改自 [mhinz/vim-startify](https://github.com/mhinz/vim-startify)) |
| [tagbar](https://github.com/chxuan/tagbar) | 使用 [majutsushi/tagbar](https://github.com/majutsushi/tagbar) 的v2.3版本， [taglist](https://github.com/vim-scripts/taglist.vim) 的替代品，显示类/方法/变量 |
| [vim-plug](https://github.com/junegunn/vim-plug) | 比 [Vundle](https://github.com/VundleVim/Vundle.vim) 下载更快的插件管理软件 |
| [YouCompleteMe](https://github.com/Valloric/YouCompleteMe) | 史上最强大的基于语义的自动补全插件，支持C/C++、C#、Python、PHP等语言 |
| [NerdTree](https://github.com/scrooloose/nerdtree) | 代码资源管理器 |
| [vim-nerdtree-syntax-highlight](https://github.com/tiagofumo/vim-nerdtree-syntax-highlight) | NerdTree文件类型高亮 |
| [nerdtree-git-plugin](https://github.com/Xuyuanp/nerdtree-git-plugin) | NerdTree显示git状态 |
| [vim-devicons](https://github.com/ryanoasis/vim-devicons) | 显示文件类型图标 |
| [Airline](https://github.com/vim-airline/vim-airline) | 可以取代 [powerline](https://github.com/powerline/powerline) 的状态栏美化插件 |
| [auto-pairs](https://github.com/jiangmiao/auto-pairs) | 自动补全引号、圆括号、花括号等 |
| [LeaderF](https://github.com/Yggdroot/LeaderF) | 比 [ctrlp](https://github.com/ctrlpvim/ctrlp.vim) 更强大的文件的模糊搜索工具 |
| [ack](https://github.com/mileszs/ack.vim) | 强大的文本搜索工具 |
| [vim-surround](https://github.com/tpope/vim-surround) | 自动增加、替换配对符的插件 |
| [vim-commentary](https://github.com/tpope/vim-commentary) | 快速注释代码插件 |
| [vim-repeat](https://github.com/tpope/vim-repeat) | 重复上一次操作 |
| [vim-endwise](https://github.com/tpope/vim-endwise) | if/end/endif/endfunction补全 |
| [tabular](https://github.com/godlygeek/tabular) | 代码、注释、表格对齐 |
| [vim-easymotion](https://github.com/easymotion/vim-easymotion) | 强大的光标快速移动工具，强大到颠覆你的插件观 |
| [incsearch.vim](https://github.com/haya14busa/incsearch.vim) | 模糊字符搜索插件 |
| [vim-fugitive](https://github.com/tpope/vim-fugitive) | 集成Git |
| [gv](https://github.com/junegunn/gv.vim) | 显示git提交记录 |
| [vim-slash](https://github.com/junegunn/vim-slash) | 优化搜索，移动光标后清除高亮 |
| [echodoc](https://github.com/Shougo/echodoc.vim) | 补全函数时在命令栏显示函数签名 |
| [vim-smooth-scroll](https://github.com/terryma/vim-smooth-scroll) | 让翻页更顺畅 |
| [clever-f.vim](https://github.com/rhysd/clever-f.vim) | 强化f和F键 |

## 4\. 快捷键

以下是部分快捷键，可通过vimplus的`,h` 命令查看 [vimplus帮助文档](https://github.com/chxuan/vimplus/blob/master/help.md) 。

| 快捷键 | 说明 |
| --- | --- |
| `,` | Leader Key |
| `<leader>n` | 打开/关闭代码资源管理器 |
| `<leader>t` | 打开/关闭函数列表 |
| `<leader>a` | .h.cpp 文件切换 |
| `<leader>u` | 转到函数声明 |
| `<leader>U` | 转到函数实现 |
| `<leader>u` | 转到变量声明 |
| `<leader>o` | 打开include文件 |
| `<leader>y` | 拷贝函数声明 |
| `<leader>p` | 生成函数实现 |
| `<leader>w` | 单词跳转 |
| `<leader>f` | 搜索~目录下的文件 |
| `<leader>F` | 搜索当前目录下的文本 |
| `<leader>g` | 显示git仓库提交记录 |
| `<leader>G` | 显示当前文件提交记录 |
| `<leader>gg` | 显示当前文件在某个commit下的完整内容 |
| `<leader>ff` | 语法错误自动修复(FixIt) |
| `<c-p>` | 切换到上一个buffer |
| `<c-n>` | 切换到下一个buffer |
| `<leader>d` | 删除当前buffer |
| `<leader>D` | 删除当前buffer外的所有buffer |
| `vim` | 运行vim编辑器时,默认启动开始页面 |
| `<F5>` | 显示语法错误提示窗口 |
| `<F9>` | 显示上一主题 |
| `<F10>` | 显示下一主题 |
| `<leader>l` | 按竖线对齐 |
| `<leader>=` | 按等号对齐 |
| `Ya` | 复制行文本到字母a |
| `Da` | 剪切行文本到字母a |
| `Ca` | 改写行文本到字母a |
| `rr` | 替换文本 |
| `<leader>r` | 全局替换，目前只支持单个文件 |
| `rev` | 翻转当前光标下的单词或使用V模式选择的文本 |
| `gcc` | 注释代码 |
| `gcap` | 注释段落 |
| `vif` | 选中函数内容 |
| `dif` | 删除函数内容 |
| `cif` | 改写函数内容 |
| `vaf` | 选中函数内容（包括函数名 花括号） |
| `daf` | 删除函数内容（包括函数名 花括号） |
| `caf` | 改写函数内容（包括函数名 花括号） |
| `fa` | 查找字母a，然后再按f键查找下一个 |
| `<leader>e` | 快速编辑~/.vimrc文件 |
| `<leader>s` | 重新加载~/.vimrc文件 |
| `<leader>vp` | 快速编辑~/.vimrc.custom.plugins文件 |
| `<leader>vc` | 快速编辑~/.vimrc.custom.config文件 |
| `<leader>h` | 打开vimplus帮助文档 |
| `<leader>H` | 打开当前光标所在单词的vim帮助文档 |
| `<leader><leader>t` | 生成try-catch代码块 |
| `<leader><leader>y` | 复制当前选中到系统剪切板 |
| `<leader><leader>i` | 安装插件 |
| `<leader><leader>u` | 更新插件 |
| `<leader><leader>c` | 删除插件 |

## 5\. FAQ

- **`vimplus怎么安装新插件？`**
编辑 [~/.vimrc.custom.plugins](https://github.com/chxuan/vimplus/blob/master/.vimrc.custom.plugins) ，添加自定义插件。
- **`vimplus怎么添加自定义配置？`**
编辑 [~/.vimrc.custom.config](https://github.com/chxuan/vimplus/blob/master/.vimrc.custom.config) ，添加自定义配置。
- **`vimplus安装脚本会在自己电脑上安装哪些软件？`**
网络良好情况下，vimplus只需30分钟左右即可将vim cpp环境配置好，vimplus真正的做到了一键配置，不让用户操心。vimplus会安装一些必备软件，比如说python、cmake、gcc、fontconfig等，vimplus也考虑到了有些系统的vim不支持python，它会自动去下载vim源码将python支持编译进去，vimplus也会安装nerd-font不让vim显示出现乱码，最最重要的是vimplus实现了ycm自动编译安装，给折腾了几天ycm都没有安装好的用户带来了新的希望，而且vimplus也支持macos和linux众多发行版，让linux发烧友频繁切换发行版而不用操心vim环境配置。最后说了这么多，不如看 [vimplus安装脚本](https://github.com/chxuan/vimplus/blob/master/install.sh) 来的直接:smile:。
- **`启动vim报错：RequestsDependencyWarning: Old version of cryptography ([1, 2, 3]) may cause slowdown.`**
可以尝试将cryptography删掉，具体见 [issues #208](https://github.com/chxuan/vimplus/issues/208) 。
- **`vimplus不支持目前用户正在使用的系统怎么办？`**
可以给作者提 [Issues](https://github.com/chxuan/vimplus/issues) ，或者自己fork vimplus来修改，并提交pr，贡献自己的一份力量。
- **`安装vimplus后Airline等插件有乱码，怎么解决？`**
linux和mac系统需设置终端字体为 `Droid Sans Mono Nerd Font` 。
- **`xshell连接远程主机不能使用vim-devicons或乱码。`**
windows系统安装 [Nerd Font](https://github.com/ryanoasis/nerd-fonts) 字体后并更改xshell字体即可。
- **`ubuntu18.04安装了nerd font但通过终端属性并没有看到该字体。`**
可以试试dconf-editor软件来设置，可以参考 [这里](https://blog.csdn.net/wang73ying/article/details/82491993) 。
- **`使用第三方库时怎么让ycm补全第三方库API？`**
vimplus安装完毕之后， `~` 目录下将会生成两个隐藏文件分别是.vimrc和.ycm\_extra\_conf.py，其中.vimrc是vim的配置文件，.ycm\_extra\_conf.py是ycm插件的配置文件，当你需要创建一个project时，需要将.ycm\_extra\_conf.py拷贝到project的顶层目录，通过修改该配置文件里面的 `flags` 变量来添加你的第三方库路径。
- **`使用vi命令报错：E492: Not an editor command:`**
vimplus安装完成后，linux下可能会同时存在vi和vim命令，执行vi时，vi加载~/.vimrc文件可能会报错，但不影响使用，如果要消除错误可以设置软链接 `ln -s /usr/bin/vim /usr/bin/vi`
- **`怎么自定义文件头，比如说添加作者、创建时间？`**
你可以修改 [chxuan/prepare-code](https://github.com/chxuan/prepare-code) 插件来达到目的，可以参考 [这里](https://blog.csdn.net/liuyangbo121/article/details/82971736) 。
- **`安装vimplus在“[ 95%] Building CXX object ycm/CMakeFiles/ycm_core.dir/ycm_core.cpp.o”等进度时出现编译报错`**
编译ycm需要消耗较大内存，建议内存大于1G，实在不行也可以开启linux swap分区。

## 6\. 无法翻墙的这种解决方案

以下是B站一位UP的视频地址，大家可以用浏览器打开自行观看，学习。

`Ps: 因为是离线安装，所以Vimplus中的插件版本不是最新的。`

---

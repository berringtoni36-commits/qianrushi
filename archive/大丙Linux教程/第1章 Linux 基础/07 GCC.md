---
title: "GCC"
chapter: "第1章 Linux 基础"
order: 7
source: "https://subingwen.cn/linux/gcc/"
author: "苏丙榅"
tags: [Linux, 教程, Subingwen]
type: reference
---

# GCC

[[archive/大丙Linux教程/第1章 Linux 基础/index|← 返回本章目录]] · [[06 Vim的使用|上一篇：Vim的使用]] · [[08 静态库和动态库|下一篇：静态库和动态库 →]]

> 来源：[原文：GCC](https://subingwen.cn/linux/gcc/)

`GCC` 是 Linux 下的编译工具集，是 `GNU Compiler Collection` 的缩写， `包含 gcc、g++` 等编译器。这个工具集不仅包含编译器，还包含其他工具集，例如 ar、nm 等。

GCC 工具集可根据具体版本和构建配置支持 C、C++、Objective-C、Fortran、Ada、Go 等语言；Java/GCJ 属于历史支持。交叉编译需要目标平台对应的工具链、头文件和库，不能仅凭宿主机上的 GCC 自动覆盖所有目标平台。

## 1\. 安装 GCC

> 有些纯净版的Linux默认没有gcc编译器, 需要自己安装, 在线安装步骤如下:

```shell
# 安装软件必须要有管理员权限
# ubuntu
$ sudo apt update           # 更新本地的软件下载列表, 得到最新的下载地址
$ sudo apt install gcc g++    # 通过下载列表中提供的地址下载安装包, 并安装

# centos
$ sudo yum update           # 更新本地的软件下载列表, 得到最新的下载地址
$ sudo yum install gcc g++    # 通过下载列表中提供的地址下载安装包, 并安装
```

gcc安装完毕之后, 可以查看版本:

```shell
# 查看 gcc 版本
$ gcc -v
$ gcc --version

# 查看 g++ 版本
$ g++ -v
$ g++ --version
```

## 2\. gcc 工作流程

> GCC 编译器对程序的编译下图所示，分为 4 个阶段： `预处理（预编译）` 、 `编译和优化` 、 `汇编` 和 `链接` 。GCC 的编译器可以将这 4 个步骤合并成一个。 先介绍一个每个步骤都分别做了写什么事儿:

1. 预处理: 在这个阶段主要做了三件事: `展开头文件` 、 `宏替换` 、 `去掉注释行`
  - 这个阶段需要GCC调用预处理器来完成, 最终得到的还是源文件, 文本格式
2. 编译: 这个阶段需要GCC调用编译器对文件进行编译, 最终得到一个汇编文件
3. 汇编: 这个阶段需要GCC调用汇编器对文件进行汇编, 最终得到一个二进制文件
4. 链接: 这个阶段需要GCC调用链接器对程序需要调用的库进行链接, 最终得到一个可执行的二进制文件

| 文件名后缀 | 说明 | gcc 参数 |
| --- | --- | --- |
| `.c` | 源文件 | 无 |
| `.i` | 预处理后的 C 文件 | `-E` |
| `.s` | 编译之后得到的汇编语言的源文件 | `-S` |
| `.o` | 汇编后得到的二进制文件 | `-c` |

![[assets/Linux教程/07-01.jpg]]

> 在 Linux 下使用 GCC 编译器编译单个文件十分简单，直接使用 gcc 命令后面加上要编译的 C 语言的源文件，GCC 会自动生成文件名为 `a.out` 的可执行文件（ `也可以通过参数 -o 指定生成的文件名` ），也就是通过一个简单的命令上边提到的4个步骤就全部执行完毕了。但是如果想要单步执行也是没问题的， 下边基于这段示例程序给大家演示一下。

```c
// 假设程序对应的源文件名为 test.c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>

int main()
{
    int array[5] = {1,2,3,4,5};
    for(int i=0; i<5; ++i)
    {
        printf("array[%d] = %d\n", i, array[i]);
    }
    return 0;
}
```

> 第一步: 对源文件进行预处理, 需要使用的gcc参数为 `-E`

```shell
# 1. 预处理, -o 指定生成的文件名
$ gcc -E test.c -o test.i
```

> 第二步: 编译预处理之后的文件, 需要使用的gcc参数为 `-S`

```shell
# 2. 编译, 得到汇编文件
$ gcc -S test.i -o test.s
```

> 第三步: 对得到的汇编文件进行汇编, 需要使用的gcc参数为 `-c`

```shell
# 3. 汇编
$ gcc -c test.s -o test.o
```

> 第四步: 将得到的二进制文件和标准库进制链接, 得到可执行的二进制文件, `不需要任何参数`

```shell
# 4. 链接
$ gcc test.o -o test
```

最后再次强调, 在使用gcc编译程序的时候可以通过参数控制内部自动执行几个步骤:

```shell
# 参数 -c 是进行文件的汇编, 汇编之前的两步会自动执行
$ gcc test.c -c -o app.o

# 该命令是直接进行链接生成可执行程序, 链接之前的三步会自动执行
$ gcc test.c -o app
```

## 3\. gcc常用参数

> 下面的表格中列出了常用的一些 `gcc` 参数, 这些 `参数在 gcc命令中没有位置要求` ，只需要编译程序的时候将需要的参数指定出来即可。

| **gcc编译选项** | **选项的意义** |
| --- | --- |
| \-E | 预处理指定的源文件，不进行编译 |
| \-S | 编译指定的源文件，但是不进行汇编 |
| `-c` | 编译、汇编指定的源文件，但是不进行链接 |
| `-o [file1] [file2] / [file2] -o [file1]` | 将文件 file2 编译成文件 file1 |
| `-I` directory (大写的i) | 指定 include 包含文件的搜索目录 |
| `-g` | 在编译的时候，生成调试信息，该程序可以被调试器调试 |
| \-D | 在程序编译的时候，指定一个宏 |
| \-w | 不生成任何警告信息, 不建议使用, 有些时候警告就是错误 |
| \-Wall | 启用一组常见警告，不等于打开编译器的全部警告；具体内容随编译器版本和语言选项变化 |
| \-O<n> | `n` 通常为 0~3；`-O0` 通常关闭优化，`-O1`、`-O2`、`-O3` 逐级增加优化，但默认级别和具体优化集合应以编译器文档为准 |
| `-l` | 在程序编译的时候，指定使用的库 |
| `-L` | 指定编译的时候，搜索的库的路径。 |
| `-fPIC/fpic` | 生成与位置无关的代码 |
| `-shared` | 生成共享目标文件。通常用在建立共享库时 |
| `-std` | 指定C方言，如:-std=c99，gcc默认的方言是GNU C |

## 3.1 指定生成的文件名 (-o)

> 该参数用于指定原文件通过 gcc 处理之后生成的新文件的名字, 有两种写法, 原文件可以写在参数 `-o` 前边后缀写在后边。

```shell
# 参数 -o的用法 , 原材料 test.c 最终生成的文件名为 app
# test.c 写在 -o 之前
$ gcc test.c -o app

# test.c 写在 -o 之后
$ gcc -o app test.c
```

## 3.2 搜索头文件 (-I)

> 如果在程序中包含了一些头文件, 但是包含的一些头文件在程序预处理的时候因为找不到无法被展开，导致程序编译失败，这时候我们可以在gcc命令中添加 `-I` 参数重新指定要引用的头文件路径, 保证编译顺利完成。

```shell
# -I, 指定头文件目录
$ tree
.
├── add.c
├── div.c
├── include
│   └── head.h
├── main.c
├── mult.c
└── sub.c

# 编译当前目录中的所有源文件，得到可执行程序
$ gcc *.c -o calc
main.c:2:18: fatal error: head.h: No such file or directory
compilation terminated.
sub.c:2:18: fatal error: head.h: No such file or directory
compilation terminated.
```

> 通过编译得到的错误信息可以知道, `源文件中包含的头文件无法被找到` 。通过提供的目录结构可以得知头文件 `head.h 在 include 目录中` ，因此可以在编译的时候重新指定头文件位置，具体操作如下：

```shell
# 可以在编译的时候重新指定头文件位置 -I 头文件目录
$ gcc *.c -o calc -I ./include
```

## 3.3 指定一个宏 (-D)

> 在程序中我们可以使用宏定义一个常量, 也可以通过宏控制某段代码是否能够被执行。在下面这段程序中第8行判断是否定义了一个叫做 `DEBUG` 的宏, 如果没有定义第9行代码就不会被执行了, 通过阅读代码能够知道这个宏是没有在程序中被定义的。

```c
// test.c
#include <stdio.h>
#define NUMBER  3

int main()
{
    int a = 10;
#ifdef DEBUG
    printf("我是一个程序猿, 我不会爬树...\n");
#endif
    for(int i=0; i<NUMBER; ++i)
    {
        printf("hello, GCC!!!\n");
    }
    return 0;
}
```

> 如果不想在程序中定义这个宏， 但是又想让它存在，通过gcc的参数 `-D` 就可以实现了，编译器会认为参数后边指定的宏在程序中是存在的。

```shell
# 在编译命令中定义这个 DEBUG 宏,
$ gcc test.c -o app -D DEBUG

# 执行生成的程序， 可以看到程序第9行的输出
$ ./app
我是一个程序猿, 我不会爬树...
hello, GCC!!!
hello, GCC!!!
hello, GCC!!!
```

`-D 参数的应用场景:`
在发布程序的时候, 一般都会要求将程序中所有的log输出去掉, 如果不去掉会影响程序的执行效率，很显然删除这些打印log的源代码是一件很麻烦的事情，解决方案是这样的：

- 将所有的打印log的代码都写到一个宏判定中, 可以模仿上边的例子
  - 在编译程序的时候指定 -D 就会有log输出
    - 在编译程序的时候不指定 -D, log就不会输出

## 4\. 多文件编译

> GCC 可以自动编译链接多个文件，不管是目标文件还是源文件，都可以使用同一个命令编译到一个可执行文件中。

## 4.1 准备工作

> 首先将程序编译之前需要的代码准备出来, 例如一个项目包含3个文件，文件 string.h, string.c 中有一个函数 strLength 用于计算字符串的长度，而在 main.c 中调用这个函数将计算的结果显示出来。

- 头文件
    ```c
    #ifndef _STRING_H_
    #define _STRING_H_
    int strLength(char *string);
    #endif // _STRING_H_
    ```
- 源文件 string.c
    ```c
    #include "string.h"
    int strLength(char *string)
    {
        int len = 0;
        while(*string++ != '\0')     // 当*string 的值为'\0'时, 停止计算
        {
            len++;
        }
        return len;     // 返回字符串长度
    }
    ```
- 源文件 main.c
    ```c
    #include <stdio.h>
    #include "string.h"
    int main(void)
    {
        char *src = "Hello, I'am Monkey·D·Luffy!!!";
        printf("string length is: %d\n", strLength(src));
        return 0;
    }
    ```

## 4.2 编译运行

> 因为头文件是包含在源文件中的, 因此在使用gcc编译程序的时候不需要指定头文件的名字（ `在头文件无法被找到的时候需要使用参数 -I 指定其具体路径而不是名字` ）。我们可以通过一个 gcc 命令将多个源文件编译并生成可执行程序，也可以分多步完成这个操作。

- 直接链接生成可执行程序
    ```shell
    # 直接生成可执行程序 test
    $ gcc -o test string.c main.c
    # 运行可执行程序
    $ ./test
    ```
- 先将源文件编成目标文件，然后进行链接得到可执行程序
    ```shell
    # 汇编生成二进制目标文件, 指定了 -c 参数之后, 源文件会自动生成 string.o 和 main.o
    $ gcc –c string.c main.c
    # 链接目标文件, 生成可执行程序 test
    $ gcc –o test string.o main.o
    # 运行可执行程序
    $ ./test
    ```

## 5\. gcc与g++

> 关于对 `gcc` 和 `g++` 很多人的理解都是比较片面的或者是对二者的理解有一些误区，下边从三个方面介绍一下二者的区别:

1. 在代码编译阶段：
  - 通常 `.c` 源文件按 C 编译，`.cpp` 源文件按 C++ 编译；`g++` 常把 `.c` 也按 C++ 处理，而 `gcc` 按扩展名决定语言（可用 `-x` 覆盖）。
2. 在链接阶段：
  - gcc 和 g++ 都会链接 C 运行库；最终链接 C++ 程序时，`g++` 通常会自动链接 C++ 标准库，而直接用 `gcc` 驱动则通常需要显式添加 `-lstdc++`。
3. `__cplusplus` 只在按 C++ 语言处理的翻译单元中定义，与驱动程序名称本身不是一回事。

综上所述：

1. gcc 和 g++ 都是 GCC 驱动程序，但源文件扩展名、`-x` 选项和最终链接阶段会影响行为。
2. 编译 C++ 时，最终链接通常使用 g++，或给 gcc 显式补上 C++ 标准库。
3. `__cplusplus` 是否定义取决于当前翻译单元是否按 C++ 编译。

```shell
# 编译 c 程序
$ gcc test.c -o test    # 使用gcc
$ g++ test.c -o test    # 使用g++

# 编译 c++ 程序
$ g++ test.cpp -o test              # 使用g++
$ gcc test.cpp -lstdc++ -o test     # 使用gcc
```

## 6\. 视频讲解

> 以上知识点对应的视频讲解可以关注 [B站-爱编程的大丙](https://space.bilibili.com/147020887)
> 视频地址: [https://www.bilibili.com/video/BV13U4y1p7kB](https://www.bilibili.com/video/BV13U4y1p7kB)

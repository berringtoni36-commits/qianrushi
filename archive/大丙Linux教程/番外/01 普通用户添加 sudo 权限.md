---
title: "普通用户添加 sudo 权限"
chapter: "番外"
order: 1
source: "https://subingwen.cn/linux/sudoers/"
author: "苏丙榅"
tags: [Linux, 教程, Subingwen]
type: reference
---

# 普通用户添加 sudo 权限

[[archive/大丙Linux教程/番外/index|← 返回本章目录]] · [[12 UDP之组播（多播）|上一篇：UDP之组播（多播）]] · [[02 Vim插件的快速安装|下一篇：Vim插件的快速安装 →]]

> 来源：[原文：普通用户添加 sudo 权限](https://subingwen.cn/linux/sudoers/)

## 1\. 添加新用户

> 我们在Linux系统中经常需要根据不同的需求创建对应的新用户, 但是新用户作为一个普通用户, 权限是非常有限的, `默认不能够使用管理员权限执行某些管理员才能执行的命令`, 给大家演示一下操作步骤:

```shell
# 添加新用户 sanji
[root@VM-8-14-centos ~]# adduser sanji

# 给新用户 sanji 设置一个密码
[root@VM-8-14-centos ~]# passwd sanji
Changing password for user sanji.
New password:
Retype new password:
passwd: all authentication tokens updated successfully.

# 切换到 sanji 用户
[root@VM-8-14-centos ~]# su - sanji

# 让 sanji 用户执行一个只有管理员才有权限执行的操作, 因此需要在命令前加 sudo
[sanji@VM-8-14-centos ~]$ sudo updatedb

We trust you have received the usual lecture from the local System
Administrator. It usually boils down to these three things:

    #1) Respect the privacy of others.
    #2) Think before you type.
    #3) With great power comes great responsibility.

[sudo] password for sanji:
sanji is not in the sudoers file.  This incident will be reported.
```

最后命令还是没能够执行, 原因是没有权限, 最后提示告诉我们 `sanji is not in the sudoers file`, 因此我们只需要将用户 `sanji` 添加到这个文件中就可以了, 说干就干。

## 2\. 添加sudo权限

这个叫做 `sudoers` 的文件位于 `/etc` 目录下, 我们先切换到 `/etc` 目录, 然后查看一下这个文件的详细信息

```shell
$ cd /etc/
$  ll sudoers
-r-------- 1 root root 4382 Jan 21 23:16 sudoers
```

我们惊奇的发现这个文件的所有者 `root` 对它也只有读权限, 默认是不能修改的, 作为 `root` 以外的其他用户对它没有任何的操作权限。

推荐使用 `visudo`，不要把 `/etc/sudoers` 临时改成 777；`visudo` 会在保存前检查语法，避免写坏后导致 sudo 不可用。不同发行版通常把管理员组命名为 `sudo`（Debian/Ubuntu）或 `wheel`（RHEL/Fedora），也可以用 `/etc/sudoers.d/` 添加单独规则。

```shell
# 直接编辑主配置文件并校验语法
$ sudo visudo

# 或编辑独立规则文件
$ sudo visudo -f /etc/sudoers.d/sanji
# 写入一行：
sanji ALL=(ALL:ALL) ALL

# Debian/Ubuntu 常见做法：加入 sudo 组
$ sudo usermod -aG sudo sanji
# RHEL/Fedora 常见做法：加入 wheel 组
$ sudo usermod -aG wheel sanji
```

重新登录 `sanji` 后验证 `sudo -l` 或执行一个明确需要管理员权限的命令；授权范围应按最小权限原则配置。

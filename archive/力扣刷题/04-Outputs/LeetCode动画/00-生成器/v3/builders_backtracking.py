"""Deterministic exhaustive-search and backtracking traces."""
from __future__ import annotations
from copy import deepcopy
from typing import Any,Callable
from series_core import Lines,complete_state,event,make_trace

def _trace(item,events,example,expected,*,algorithm,invariant,aha,time,space,input_data,scene="backtracking"):
 return make_trace(item,scene,events,algorithm=algorithm,invariant=invariant,aha=aha,time=time,space=space,example_text=example[0],expected_text=example[1],input_data=input_data,expected=expected)

def _s(action,values,variables,path,output,**extra):
 return complete_state("backtracking",action,values=values,variables=variables,path=deepcopy(path),output=deepcopy(output),formula=extra.get("formula",""),active=extra.get("active",[]),result=extra.get("result",[]),matrix=extra.get("matrix"),activeCells=extra.get("activeCells",[]),status=extra.get("status","running"))

def build_46(item,code,example):
 line=Lines(code);nums=[1,2,3];path=[None]*3;used=[False]*3;ans=[];events=[event(line.id("path = vector<int>"),_s("初始化路径和使用标记",nums,{"u":0,"used":"000"},[],ans),"第 u 层决定排列的第 u 个位置。",phase="setup")]
 def dfs(u):
  if u==3:
   ans.append(path.copy());events.append(event(line.id("ans.push_back(path)"),_s(f"记录排列 {path}",nums,{"u":u,"used":"".join('1' if x else '0' for x in used)},path,ans,formula=str(path),result=[0,1,2]),"三个位置都填满时答案才出现。",phase="accept"));return
  for i,x in enumerate(nums):
   events.append(event(line.id("if (st[i] == false)"),_s(f"层 {u} 检查数字 {x}",nums,{"u":u,"i":i,"used":used[i]},[x for x in path[:u] if x is not None],ans,active=[i],formula=f"unused={not used[i]}"),"同一排列中每个下标只能使用一次。",phase="compare"))
   if used[i]:continue
   path[u]=x;used[i]=True;events.append(event([line.id("path[u] = nums[i]"),line.id("st[i] = true")],_s(f"选择 {x} 放入位置 {u}",nums,{"u":u,"i":i,"used":"".join('1' if v else '0' for v in used)},path[:u+1],ans,active=[i]),"选择后进入下一层。",phase="mutate"));dfs(u+1);used[i]=False;path[u]=None
   events.append(event(line.id("st[i] = false"),_s(f"撤销数字 {x}",nums,{"u":u,"i":i,"used":"".join('1' if v else '0' for v in used)},path[:u],ans,active=[i]),"撤销恢复进入本分支前的状态。",phase="mutate"))
 dfs(0);events.append(event(line.id("return ans"),_s("返回 6 个全排列",nums,{"count":len(ans)},[],ans,formula="6 permutations",result=[0,1,2],status="return"),"搜索树所有叶子恰好对应 3! 个排列。",phase="return"))
 return _trace(item,events,example,ans,algorithm="位置驱动的回溯",invariant="path[0:u] 无重复且 used 与路径完全一致",aha="选择后递归，返回时必须撤销 used",time="O(n·n!)",space="O(n)",input_data=nums)

def build_78(item,code,example):
 line=Lines(code);nums=[1,2,3];ans=[];events=[event(line.id("for (int i = 0; i < 1 << n"),_s("枚举 3 位二进制掩码",nums,{"mask":0,"n":3},[],ans),"每一位独立表示对应元素选或不选。",phase="setup")]
 for mask in range(8):
  path=[]
  for j,x in enumerate(nums):
   selected=bool(mask>>j&1)
   events.append(event(line.id("if (i >> j & 1)"),_s(f"mask {mask:03b} 检查第 {j} 位",nums,{"mask":f"{mask:03b}","j":j,"selected":selected},path,ans,active=[j],formula=f"bit={int(selected)}"),"位为 1 时加入对应元素。",phase="compare"))
   if selected:path.append(x)
  ans.append(path.copy());events.append(event(line.id("res.push_back(path)"),_s(f"记录子集 {path}",nums,{"mask":f"{mask:03b}"},path,ans,formula=str(path),result=[j for j in range(3) if mask>>j&1]),"每个掩码唯一对应一个子集。",phase="accept"))
 events.append(event(line.id("return res"),_s("返回 8 个子集",nums,{"count":8},[],ans,formula="2³=8",result=[0,1,2],status="return"),"所有选/不选组合均已覆盖。",phase="return"))
 return _trace(item,events,example,ans,algorithm="位掩码枚举子集",invariant="mask 的前 j 位与当前 path 完全一致",aha="n 个独立二选一状态正好对应 0..2^n-1",time="O(n2^n)",space="O(n)",input_data=nums)

def build_17(item,code,example):
 line=Lines(code);digits="23";mapping={"2":"abc","3":"def"};ans=[];events=[event(line.id("dfs(digits, 0"),_s("从数字 2 的字母集合开始",list(digits),{"u":0},[],ans),"每层消费一个数字。",phase="setup")]
 def dfs(u,path):
  if u==len(digits):ans.append(path);events.append(event(line.id("ans.push_back(path)"),_s(f"记录组合 {path}",list(digits),{"u":u},list(path),ans,formula=path,result=list(range(len(path)))),"消费完全部数字才形成答案。",phase="accept"));return
  for ch in mapping[digits[u]]:
   events.append(event(line.id("dfs(digits, u + 1"),_s(f"数字 {digits[u]} 选择字母 {ch}",list(digits),{"u":u,"digit":digits[u],"char":ch},list(path+ch),ans,formula=path+ch),"选择一个映射字母后进入下一位。",phase="mutate"));dfs(u+1,path+ch)
 dfs(0,"");events.append(event(line.id("return ans"),_s("返回 9 个字母组合",list(digits),{"count":9},[],ans,formula=str(ans),result=[0,1],status="return"),"3×3 个叶子全部记录。",phase="return"))
 return _trace(item,events,example,ans,algorithm="按数字层级 DFS",invariant="path 长度始终等于已处理数字数 u",aha="每层分支数由当前按键映射决定",time="O(3^m4^n)",space="O(m+n)",input_data=digits)

def build_39(item,code,example):
 line=Lines(code);c=[2,3,6,7];target=7;ans=[];path=[];events=[event(line.id("dfs(c, 0, target)"),_s("从候选 2 开始分配个数",c,{"u":0,"target":target},path,ans),"第 u 层枚举 c[u] 使用 0,1,2... 次。",phase="setup")]
 def dfs(u,remain):
  if remain==0:ans.append(path.copy());events.append(event(line.id("ans.push_back(path)"),_s(f"记录组合 {path}",c,{"u":u,"target":remain},path,ans,formula=str(path),result=[c.index(x) for x in set(path)]),"剩余目标归零时记录。",phase="accept"));return
  if u==len(c):return
  max_count=remain//c[u]
  for count in range(max_count+1):
   events.append(event(line.id("dfs(c, u + 1"),_s(f"选择 {count} 个 {c[u]}",c,{"u":u,"target":remain,"count":count},path,ans,active=[u],formula=f"next target={remain-c[u]*count}"),"固定当前候选的使用次数后处理下一候选。",phase="mutate"));dfs(u+1,remain-c[u]*count);path.append(c[u])
  for _ in range(max_count+1):
   if path:path.pop();events.append(event(line.id("path.pop_back"),_s(f"撤销候选 {c[u]}",c,{"u":u,"target":remain},path,ans,active=[u]),"循环结束后恢复进入本层前的路径。",phase="mutate"))
 dfs(0,target);expected=deepcopy(ans)
 events.append(event(line.id("return ans"),_s("返回两个组合",c,{"count":len(ans)},[],ans,formula=str(ans),result=list(range(4)),status="return"),"按候选下标分层避免了排列重复。",phase="return"))
 return _trace(item,events,example,expected,algorithm="按候选个数枚举回溯",invariant="进入 u 层时 path 只含下标小于 u 的候选",aha="同一数字可重复使用，因此枚举使用次数",time="exponential",space="O(target)",input_data={"candidates":c,"target":target})

def build_22(item,code,example):
 line=Lines(code);n=3;ans=[];events=[event(line.id("dfs(n, 0, 0"),_s("左右括号计数从 0 开始",["(",")"],{"lc":0,"rc":0,"n":n},[],ans),"任意前缀必须满足 lc≥rc。",phase="setup")]
 def dfs(lc,rc,seq):
  if lc==rc==n:ans.append(seq);events.append(event(line.id("ans.push_back(seq)"),_s(f"记录 {seq}",["(",")"],{"lc":lc,"rc":rc},list(seq),ans,formula=seq,result=list(range(len(seq)))),"左右括号都用满时得到合法串。",phase="accept"));return
  if lc<n:events.append(event(line.id("if (lc < n)"),_s("添加左括号",["(",")"],{"lc":lc+1,"rc":rc},list(seq+"("),ans,formula=seq+"("),"左括号未满即可选择。",phase="mutate"));dfs(lc+1,rc,seq+"(")
  if rc<n and lc>rc:events.append(event(line.id("if (rc < n && lc > rc)"),_s("添加右括号",["(",")"],{"lc":lc,"rc":rc+1},list(seq+")"),ans,formula=seq+")"),"只有已有未闭合左括号时才能添加右括号。",phase="mutate"));dfs(lc,rc+1,seq+")")
 dfs(0,0,"");events.append(event(line.id("return ans"),_s("返回 5 个合法括号串",["(",")"],{"count":5},[],ans,formula=str(ans),status="return"),"所有合法前缀分支都走到叶子。",phase="return"))
 return _trace(item,events,example,ans,algorithm="合法前缀约束 DFS",invariant="0≤rc≤lc≤n",aha="在生成过程中剪掉右括号过多的非法前缀",time="O(Catalan(n))",space="O(n)",input_data=n)

def build_79(item,code,example):
 line=Lines(code);board=[list("ABCE"),list("SFCS"),list("ADEE")];word="ABCCED";events=[event(line.id("for (int i = 0"),_s("逐格尝试单词起点",list(word),{"u":0,"x":0,"y":0},[],[],matrix=board),"DFS 路径不能重复使用同一格。",phase="setup")]
 found_path=[]
 def dfs(u,x,y,path):
  if board[x][y]!=word[u]:events.append(event(line.id("if (board[x][y] != word[u])"),_s(f"({x},{y})={board[x][y]} 不匹配 {word[u]}",list(word),{"u":u,"x":x,"y":y},path,[],matrix=board,activeCells=[f"{x},{y}"],formula="mismatch"),"字符不匹配立即回退。",phase="compare"));return False
  path=path+[(x,y)];events.append(event(line.id("board[x][y] = '.'"),_s(f"匹配 {word[u]} 并标记 ({x},{y})",list(word),{"u":u,"x":x,"y":y},path,[],matrix=board,activeCells=[f"{x},{y}"],formula="visited"),"临时标记阻止当前路径重复使用。",phase="mutate"))
  if u==len(word)-1:found_path.extend(path);return True
  old=board[x][y];board[x][y]='.'
  for dx,dy in [(-1,0),(0,1),(1,0),(0,-1)]:
   a,b=x+dx,y+dy
   if 0<=a<3 and 0<=b<4 and board[a][b]!='.' and dfs(u+1,a,b,path):board[x][y]=old;return True
  board[x][y]=old;events.append(event(line.id("board[x][y] = t"),_s(f"恢复 ({x},{y})",list(word),{"u":u,"x":x,"y":y},path[:-1],[],matrix=board),"失败分支撤销访问标记。",phase="mutate"));return False
 found=False
 for i in range(3):
  for j in range(4):
   if dfs(0,i,j,[]):found=True;break
  if found:break
 events.append(event(line.id("return true"),_s("找到 ABCCED 路径",list(word),{"length":len(found_path)},found_path,True,matrix=board,activeCells=[f"{x},{y}" for x,y in found_path],result=list(range(len(word))),formula="ABCCED",status="return"),"六个字符按相邻格顺序匹配。",phase="return"))
 return _trace(item,events,example,True,algorithm="网格路径 DFS + 原地标记",invariant="当前 path 中坐标互不重复且拼接等于 word 前缀",aha="进入格子后临时改写，返回时恢复",time="O(mn·4^L)",space="O(L)",input_data={"board":[list("ABCE"),list("SFCS"),list("ADEE")],"word":word})

def build_131(item,code,example):
 line=Lines(code);s="aab";n=3;pal=[[False]*n for _ in range(n)];events=[event(line.id("f = vector<vector<bool>>"),_s("预处理回文区间",list(s),{"i":None,"j":None},[],[],matrix=pal),"DFS 只枚举已经确认是回文的切片。",phase="setup")]
 for j in range(n):
  for i in range(j+1):
   pal[i][j]=i==j or (s[i]==s[j] and (i+1>j-1 or pal[i+1][j-1]))
   events.append(event(line.id("if (i == j)","else if (s[i] == s[j])"),_s(f"区间 {s[i:j+1]} 回文={pal[i][j]}",list(s),{"i":i,"j":j},[],[],matrix=pal,activeCells=[f"{i},{j}"],formula=str(pal[i][j])),"短区间优先计算保证内部状态已知。",phase="mutate"))
 ans=[];path=[]
 def dfs(u):
  if u==n:ans.append(path.copy());events.append(event(line.id("ans.push_back(path)"),_s(f"记录分割 {path}",list(s),{"u":u},path,ans,formula=str(path)),"字符串恰好切完时记录。",phase="accept"));return
  for i in range(u,n):
   if pal[u][i]:
    part=s[u:i+1];path.append(part);events.append(event(line.id("path.push_back"),_s(f"选择回文片段 {part}",list(s),{"u":u,"i":i},path,ans,formula=part),"下一层从 i+1 继续切。",phase="mutate"));dfs(i+1);path.pop()
    events.append(event(line.id("path.pop_back"),_s(f"撤销片段 {part}",list(s),{"u":u,"i":i},path,ans),"恢复切分点以尝试下一个回文片段。",phase="mutate"))
 dfs(0);events.append(event(line.id("return ans"),_s("返回两种回文分割",list(s),{"count":2},[],ans,formula=str(ans),status="return"),"[a,a,b] 与 [aa,b] 覆盖全部合法切法。",phase="return"))
 return _trace(item,events,example,ans,algorithm="回文预处理 + 切分回溯",invariant="path 中每段均为回文且首尾连续覆盖 s 前缀",aha="先用 DP 判回文，搜索时只走合法切片",time="O(n²+answers)",space="O(n²)",input_data=s)

def build_51(item,code,example):
 line=Lines(code);n=4;board=[list("....") for _ in range(n)];cols=set();diag=set();anti=set();ans=[];events=[event(line.id("path = vector<string>"),_s("建立 4×4 空棋盘",list(range(4)),{"row":0},[],ans,matrix=board),"每行恰好放一个皇后。",phase="setup")]
 def dfs(row):
  if row==n:
   sol=["".join(r) for r in board];ans.append(sol);events.append(event(line.id("ans.push_back(path)"),_s("记录一种 N 皇后布局",list(range(4)),{"row":row},[(r,next(i for i,v in enumerate(board[r]) if v=='Q')) for r in range(n)],ans,matrix=board,activeCells=[f"{r},{c}" for r,c in [(r,next(i for i,v in enumerate(board[r]) if v=='Q')) for r in range(n)]],formula=str(sol)),"四行全部合法放置后才记录。",phase="accept"));return
  for c in range(n):
   ok=c not in cols and row-c not in diag and row+c not in anti
   events.append(event(line.id("if (!col[i]"),_s(f"检查位置 ({row},{c})",list(range(4)),{"row":row,"col":c,"valid":ok},[(r,next((i for i,v in enumerate(board[r]) if v=='Q'),None)) for r in range(row)],ans,matrix=board,activeCells=[f"{row},{c}"],formula=str(ok)),"列、主对角线、副对角线均未占用才可放置。",phase="compare"))
   if not ok:continue
   cols.add(c);diag.add(row-c);anti.add(row+c);board[row][c]='Q';events.append(event([line.id("col[i] = dg"),line.id("path[u][i] = 'Q'")],_s(f"在 ({row},{c}) 放皇后",list(range(4)),{"row":row,"col":c},[(r,next(i for i,v in enumerate(board[r]) if v=='Q')) for r in range(row+1)],ans,matrix=board,activeCells=[f"{row},{c}"]),"占用三类冲突标记后递归下一行。",phase="mutate"));dfs(row+1);board[row][c]='.';cols.remove(c);diag.remove(row-c);anti.remove(row+c)
   events.append(event([line.id("path[u][i] = '.'"),line.id("col[i] = dg",occurrence=2)],_s(f"撤销 ({row},{c}) 皇后",list(range(4)),{"row":row,"col":c},[(r,next(i for i,v in enumerate(board[r]) if v=='Q')) for r in range(row)],ans,matrix=board),"撤销棋盘与三组占用标记。",phase="mutate"))
 dfs(0);events.append(event(line.id("return ans"),_s("返回 2 种 N 皇后布局",list(range(4)),{"count":2},[],ans,formula="2 solutions",status="return"),"所有合法列选择分支均已遍历。",phase="return"))
 return _trace(item,events,example,ans,algorithm="逐行放置 + 三集合剪枝",invariant="已放皇后两两不同行、不同列、不同对角线",aha="row-col 与 row+col 唯一标识两类对角线",time="O(n!)",space="O(n)",input_data=n)

BUILDERS:dict[int,Callable]={17:build_17,22:build_22,39:build_39,46:build_46,51:build_51,78:build_78,79:build_79,131:build_131}

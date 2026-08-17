"""Deterministic binary-tree traces."""
from __future__ import annotations
from collections import defaultdict,deque
from copy import deepcopy
from typing import Any,Callable
from series_core import Lines,complete_state,event,make_trace

def _trace(item,events,example,expected,*,algorithm,invariant,aha,time="O(n)",space="O(h)",input_data=None):
 return make_trace(item,"tree-graph",events,algorithm=algorithm,invariant=invariant,aha=aha,time=time,space=space,example_text=example[0],expected_text=example[1],input_data=input_data,expected=expected)

def _state(action,nodes,edges,variables,*,active=[],result=[],queue=None,stack=None,hash=None,output=None,formula="",status="running"):
 s=complete_state("tree-graph",action,nodes=deepcopy(nodes),edges=deepcopy(edges),variables=variables,active=active,result=result,formula=formula,status=status)
 if queue is not None:s["queue"]=queue
 if stack is not None:s["stack"]=stack
 if hash is not None:s["hash"]=hash
 if output is not None:s["output"]=output
 return s

def _nodes(spec):return [{"id":nid,"value":v,"level":level,"order":order} for nid,v,level,order in spec]
def _edges(pairs):return [{"from":a,"to":b} for a,b in pairs]

def build_94(item,code,example):
 line=Lines(code);nodes=_nodes([("n1",1,0,0),("n2",2,1,1),("n3",3,2,0)]);edges=_edges([("n1","n2"),("n2","n3")]);left={"n1":None,"n2":"n3","n3":None};right={"n1":"n2","n2":None,"n3":None};vals={"n1":1,"n2":2,"n3":3};ans=[];events=[event(line.id("dfs(root)"),_state("从根节点开始中序 DFS",nodes,edges,{"root":"n1"},stack=[]),"访问顺序固定为左子树、根、右子树。",phase="setup")]
 def dfs(u,stack):
  if not u:return
  events.append(event(line.id("dfs(root->left)"),_state(f"进入 {vals[u]} 的左子树",nodes,edges,{"root":u},active=[u],stack=stack+[u]),"先完整处理左子树。",phase="inspect"));dfs(left[u],stack+[u]);ans.append(vals[u])
  events.append(event(line.id("ans.push_back"),_state(f"记录节点 {vals[u]}",nodes,edges,{"root":u},active=[u],result=[k for k,v in vals.items() if v in ans],stack=stack,output=ans.copy(),formula=str(ans)),"左子树返回后才访问根。",phase="accept"));dfs(right[u],stack+[u])
 dfs("n1",[]);events.append(event(line.id("return ans"),_state("返回中序 [1,3,2]",nodes,edges,{"count":3},result=["n1","n3","n2"],output=ans,formula=str(ans),status="return"),"所有节点按中序恰好记录一次。",phase="return"))
 return _trace(item,events,example,ans,algorithm="递归中序遍历",invariant="节点在左子树完全处理后、右子树处理前记录",aha="递归调用顺序直接定义遍历顺序",input_data=example[0])

def build_104(item,code,example):
 line=Lines(code);nodes=_nodes([("n3",3,0,0),("n9",9,1,0),("n20",20,1,1),("n15",15,2,0),("n7",7,2,1)]);edges=_edges([("n3","n9"),("n3","n20"),("n20","n15"),("n20","n7")]);children={"n3":("n9","n20"),"n9":(None,None),"n20":("n15","n7"),"n15":(None,None),"n7":(None,None)};vals={x["id"]:x["value"] for x in nodes};events=[event(line.id("if (!root) return 0"),_state("空子树深度定义为 0",nodes,edges,{"root":"n3"}),"节点深度由更深子树加一。",phase="setup")]
 def dfs(u):
  if not u:return 0
  l=dfs(children[u][0]);r=dfs(children[u][1]);d=max(l,r)+1
  events.append(event(line.id("return max(maxDepth"),_state(f"节点 {vals[u]} 深度=max({l},{r})+1={d}",nodes,edges,{"root":u,"left":l,"right":r,"depth":d},active=[u],formula=f"max({l},{r})+1={d}"),"后序返回时左右深度都已确定。",phase="mutate"));return d
 answer=dfs("n3");events.append(event(line.id("return max(maxDepth"),_state("返回最大深度 3",nodes,edges,{"depth":answer},result=["n3","n20","n15"],output=answer,formula="return 3",status="return"),"最长根到叶路径含 3 个节点。",phase="return"))
 return _trace(item,events,example,3,algorithm="后序递归求高度",invariant="返回值是当前子树最大深度",aha="当前深度等于左右子树较大深度加一",input_data=example[0])

def build_226(item,code,example):
 line=Lines(code);nodes=_nodes([("n4",4,0,0),("n2",2,1,0),("n7",7,1,1),("n1",1,2,0),("n3",3,2,1),("n6",6,2,2),("n9",9,2,3)]);pairs=[("n4","n2"),("n4","n7"),("n2","n1"),("n2","n3"),("n7","n6"),("n7","n9")];children={"n4":["n2","n7"],"n2":["n1","n3"],"n7":["n6","n9"],"n1":[None,None],"n3":[None,None],"n6":[None,None],"n9":[None,None]};events=[event(line.id("swap(root->left"),_state("递归前先交换每个节点左右孩子",nodes,_edges(pairs),{"root":"n4"}),"交换当前节点后再递归新的左右子树。",phase="setup")]
 def dfs(u):
  if not u:return
  children[u].reverse();pairs[:]=[(a,b) for a,b in pairs if a!=u]+[(u,v) for v in children[u] if v]
  events.append(event(line.id("swap(root->left"),_state(f"交换节点 {u[1:]} 的左右孩子",nodes,_edges(pairs),{"root":u},active=[u],formula="left ⇄ right"),"每个节点局部交换一次。",phase="mutate"));dfs(children[u][0]);dfs(children[u][1])
 dfs("n4");level=[4,7,2,9,6,3,1]
 events.append(event(line.id("return root"),_state("返回完全翻转的二叉树",nodes,_edges(pairs),{"root":"n4"},result=[x["id"] for x in nodes],output=level,formula=str(level),status="return"),"所有父节点的左右边都已镜像。",phase="return"))
 return _trace(item,events,example,level,algorithm="逐节点交换左右子树",invariant="已访问节点左右孩子均已交换",aha="整棵树镜像等价于每个节点独立交换左右孩子",input_data=example[0])

def build_101(item,code,example):
 line=Lines(code);nodes=_nodes([("r",1,0,0),("l2",2,1,0),("r2",2,1,1),("l3",3,2,0),("l4",4,2,1),("r4",4,2,2),("r3",3,2,3)]);edges=_edges([("r","l2"),("r","r2"),("l2","l3"),("l2","l4"),("r2","r4"),("r2","r3")]);mirror=[("l2","r2"),("l3","r3"),("l4","r4")];events=[event(line.id("return dfs(root->left"),_state("从根的左右子树开始镜像比较",nodes,edges,{"p":"l2","q":"r2"},active=["l2","r2"]),"镜像节点值相等且外侧、内侧递归配对。",phase="setup")]
 ok=True
 for p,q in mirror:
  equal=next(x["value"] for x in nodes if x["id"]==p)==next(x["value"] for x in nodes if x["id"]==q);ok&=equal
  events.append(event(line.id("if (!p || !q || p->val != q->val)"),_state(f"比较镜像节点 {p} 与 {q}: 相等",nodes,edges,{"p":p,"q":q,"equal":equal},active=[p,q],formula=str(equal)),"任一不等即可判非对称。",phase="compare"))
 events.append(event(line.id("return dfs(p->left"),_state("外侧与内侧递归都成立",nodes,edges,{"symmetric":ok},result=[x["id"] for x in nodes],output=ok,formula="true && true",status="return"),"所有镜像位置匹配，返回 true。",phase="return"))
 return _trace(item,events,example,True,algorithm="成对镜像 DFS",invariant="递归参数 p,q 始终位于互为镜像的位置",aha="比较 p.left↔q.right 与 p.right↔q.left",input_data=example[0])

def build_543(item,code,example):
 line=Lines(code);nodes=_nodes([("n1",1,0,0),("n2",2,1,0),("n3",3,1,1),("n4",4,2,0),("n5",5,2,1)]);edges=_edges([("n1","n2"),("n1","n3"),("n2","n4"),("n2","n5")]);ch={"n1":("n2","n3"),"n2":("n4","n5"),"n3":(None,None),"n4":(None,None),"n5":(None,None)};ans=0;events=[event(line.id("int ans = 0"),_state("直径答案从 0 条边开始",nodes,edges,{"ans":0}),"每个节点都作为路径最高拐点计算一次。",phase="setup")]
 def dfs(u):
  nonlocal ans
  if not u:return 0
  l=dfs(ch[u][0]);r=dfs(ch[u][1]);ans=max(ans,l+r);height=max(l,r)+1
  events.append(event([line.id("ans = max"),line.id("return max(left")],_state(f"节点 {u}: 左高 {l}、右高 {r}、直径 {ans}",nodes,edges,{"root":u,"left":l,"right":r,"ans":ans,"height":height},active=[u],formula=f"diameter={l}+{r}; height={height}"),"向上只能返回单边高度，答案可使用左右两边。",phase="mutate"));return height
 dfs("n1");events.append(event(line.id("return ans"),_state("返回直径 3",nodes,edges,{"ans":ans},result=["n4","n2","n1","n3"],output=ans,formula="3 edges",status="return"),"路径 4-2-1-3 最长。",phase="return"))
 return _trace(item,events,example,3,algorithm="后序高度 + 拐点直径",invariant="dfs 返回向父节点可延伸的单边最大节点数",aha="经过 u 的路径可同时取左右高度，向上却只能取一边",input_data=example[0])

def _level_tree():
 nodes=_nodes([("n3",3,0,0),("n9",9,1,0),("n20",20,1,1),("n15",15,2,0),("n7",7,2,1)]);edges=_edges([("n3","n9"),("n3","n20"),("n20","n15"),("n20","n7")]);ch={"n3":["n9","n20"],"n9":[],"n20":["n15","n7"],"n15":[],"n7":[]};vals={x["id"]:x["value"] for x in nodes};return nodes,edges,ch,vals

def build_102(item,code,example):
 line=Lines(code);nodes,edges,ch,vals=_level_tree();q=deque(["n3"]);out=[];events=[event(line.id("if (root) q.push"),_state("根节点入 BFS 队列",nodes,edges,{"level":0},queue=list(q)),"每轮固定当前队列长度作为一层。",phase="setup")];depth=0
 while q:
  size=len(q);level=[];events.append(event(line.id("int len = q.size()"),_state(f"第 {depth} 层有 {size} 个节点",nodes,edges,{"level":depth,"len":size},queue=list(q),active=list(q),formula=f"len={size}"),"本轮新入队子节点留给下一层。",phase="inspect"))
  for _ in range(size):
   u=q.popleft();level.append(vals[u]);q.extend(ch[u]);events.append(event([line.id("q.pop()"),line.id("level.push_back")],_state(f"出队并记录 {vals[u]}",nodes,edges,{"level":depth,"node":u},queue=list(q),active=[u],output=out+[level],formula=str(level)),"当前层按从左到右顺序收集。",phase="accept"))
  out.append(level);depth+=1
 events.append(event(line.id("return res"),_state("返回三层遍历结果",nodes,edges,{"levels":depth},result=[x["id"] for x in nodes],output=out,formula=str(out),status="return"),"每层边界由入层时的队列长度锁定。",phase="return"))
 return _trace(item,events,example,out,algorithm="按层定长 BFS",invariant="每轮开始队列恰好包含当前层全部节点",aha="先保存 len，避免新入队子节点混入当前层",space="O(width)",input_data=example[0])

def build_108(item,code,example):
 line=Lines(code);nums=[-10,-3,0,5,9];nodes=[];edges=[];events=[event(line.id("return build(nums"),_state("从完整有序区间构造",nodes,edges,{"l":0,"r":4}),"每个区间选择中点作为根。",phase="setup")]
 def build(l,r,level,parent=None,side=None):
  if l>r:return None
  mid=(l+r)//2;nid=f"n{mid}";nodes.append({"id":nid,"value":nums[mid],"level":level,"order":mid})
  if parent:edges.append({"from":parent,"to":nid})
  events.append(event([line.id("int mid = l + r"),line.id("new TreeNode(nums[mid])")],_state(f"区间 [{l},{r}] 取中点 {mid}，值 {nums[mid]}",nodes,edges,{"l":l,"r":r,"mid":mid},active=[nid],formula=f"mid={mid}"),"中点左右元素数量最多相差一。",phase="mutate"));build(l,mid-1,level+1,nid,"left");build(mid+1,r,level+1,nid,"right");return nid
 root=build(0,4,0);level=[0,-10,5,None,-3,None,9]
 events.append(event(line.id("return root"),_state("返回以 0 为根的平衡 BST",nodes,edges,{"root":root},result=[x["id"] for x in nodes],output=level,formula="balanced BST",status="return"),"每个子区间同样按中点递归。",phase="return"))
 return _trace(item,events,example,level,algorithm="有序区间中点递归",invariant="每个节点左区间全小于根、右区间全大于根",aha="中点同时保证 BST 顺序与高度平衡",time="O(n)",space="O(log n)",input_data=nums)

def build_98(item,code,example):
 line=Lines(code);nodes=_nodes([("n2",2,0,0),("n1",1,1,0),("n3",3,1,1)]);edges=_edges([("n2","n1"),("n2","n3")]);ch={"n2":("n1","n3"),"n1":(None,None),"n3":(None,None)};vals={"n2":2,"n1":1,"n3":3};events=[event(line.id("return dfs(root)[0]"),_state("后序收集每棵子树的合法性与极值",nodes,edges,{"root":"n2"}),"父节点只需左右子树最小/最大值。",phase="setup")]
 def dfs(u):
  valid=True;mn=mx=vals[u]
  if ch[u][0]:
   lv,lmn,lmx=dfs(ch[u][0]);valid&=lv and lmx<vals[u];mn=min(mn,lmn);mx=max(mx,lmx)
   events.append(event(line.id("if (!t[0] || t[2] >= root->val)"),_state(f"左子树最大值 {lmx} < {vals[u]}",nodes,edges,{"root":u,"valid":valid,"min":mn,"max":mx},active=[u,ch[u][0]],formula=f"{lmx}<{vals[u]}"),"左子树所有值必须小于根。",phase="compare"))
  if ch[u][1]:
   rv,rmn,rmx=dfs(ch[u][1]);valid&=rv and rmn>vals[u];mn=min(mn,rmn);mx=max(mx,rmx)
   events.append(event(line.id("if (!t[0] || t[1] <= root->val)"),_state(f"右子树最小值 {rmn} > {vals[u]}",nodes,edges,{"root":u,"valid":valid,"min":mn,"max":mx},active=[u,ch[u][1]],formula=f"{rmn}>{vals[u]}"),"右子树所有值必须大于根。",phase="compare"))
  events.append(event(line.id("return res"),_state(f"子树 {u} 返回 [{int(valid)},{mn},{mx}]",nodes,edges,{"root":u,"valid":valid,"min":mn,"max":mx},active=[u],formula=str([int(valid),mn,mx])),"极值摘要供父节点跨层验证。",phase="mutate"));return valid,mn,mx
 answer=dfs("n2")[0];events.append(event(line.id("return dfs(root)[0]"),_state("返回合法 BST=true",nodes,edges,{"valid":answer},result=["n1","n2","n3"],output=answer,formula="true",status="return"),"每个节点均满足全子树边界。",phase="return"))
 return _trace(item,events,example,True,algorithm="后序返回子树极值",invariant="dfs 返回 [合法,最小值,最大值] 的完整摘要",aha="不能只比较直接孩子，必须携带整棵子树极值",input_data=example[0])

def build_230(item,code,example):
 line=Lines(code);nodes=_nodes([("n3",3,0,0),("n1",1,1,0),("n4",4,1,1),("n2",2,2,1)]);edges=_edges([("n3","n1"),("n3","n4"),("n1","n2")]);order=["n1","n2","n3","n4"];vals={"n1":1,"n2":2,"n3":3,"n4":4};k=1;events=[event(line.id("k = _k"),_state("k=1，开始 BST 中序遍历",nodes,edges,{"k":k}),"BST 中序序列严格递增。",phase="setup")]
 for u in order:
  k-=1;events.append(event(line.id("if ( -- k == 0)"),_state(f"访问 {vals[u]}，k 减为 {k}",nodes,edges,{"root":u,"k":k},active=[u],formula=f"--k={k}"),"每访问一个节点就消费一个排名。",phase="compare"))
  if k==0:answer=vals[u];events.append(event(line.id("ans = root->val"),_state(f"第 1 小为 {answer}",nodes,edges,{"root":u,"k":k,"ans":answer},active=[u],result=[u],formula=str(answer)),"命中后返回 true 提前终止递归。",phase="accept"));break
 events.append(event(line.id("return ans"),_state("返回第 1 小元素 1",nodes,edges,{"ans":answer},result=["n1"],output=answer,formula="return 1",status="return"),"中序第一个节点即最小值。",phase="return"))
 return _trace(item,events,example,1,algorithm="BST 中序计数",invariant="已访问节点恰为 BST 中最小的若干个",aha="BST 中序顺序就是升序排名",input_data=example[0])

def build_199(item,code,example):
 line=Lines(code);nodes=_nodes([("n1",1,0,0),("n2",2,1,0),("n3",3,1,1),("n5",5,2,0),("n4",4,2,1)]);edges=_edges([("n1","n2"),("n1","n3"),("n2","n5"),("n3","n4")]);ch={"n1":["n2","n3"],"n2":["n5"],"n3":["n4"],"n5":[],"n4":[]};vals={x["id"]:x["value"] for x in nodes};q=deque(["n1"]);out=[];events=[event(line.id("q.push(root)"),_state("根节点入队",nodes,edges,{"level":0},queue=list(q)),"每层最后出队节点就是右侧可见节点。",phase="setup")];level=0
 while q:
  size=len(q)
  for i in range(size):
   u=q.popleft();q.extend(ch[u]);events.append(event(line.id("q.pop()"),_state(f"第 {level} 层处理 {vals[u]}",nodes,edges,{"level":level,"i":i,"len":size},queue=list(q),active=[u],formula=f"last={i==size-1}"),"保持从左到右入队顺序。",phase="inspect"))
   if i==size-1:out.append(vals[u]);events.append(event(line.id("res.push_back"),_state(f"记录右视图值 {vals[u]}",nodes,edges,{"level":level},queue=list(q),active=[u],result=[u],output=out.copy(),formula=str(out)),"层内最后节点最靠右。",phase="accept"))
  level+=1
 events.append(event(line.id("return res"),_state("返回右视图 [1,3,4]",nodes,edges,{"levels":level},result=["n1","n3","n4"],output=out,formula=str(out),status="return"),"每层恰好记录一个节点。",phase="return"))
 return _trace(item,events,example,out,algorithm="层序遍历取层尾",invariant="一层节点按从左到右顺序出队",aha="每层最后一个节点就是右侧第一个可见节点",space="O(width)",input_data=example[0])

def build_114(item,code,example):
 line=Lines(code);nodes=_nodes([("n1",1,0,0),("n2",2,1,0),("n5",5,1,1),("n3",3,2,0),("n4",4,2,1),("n6",6,2,2)]);children={"n1":["n2","n5"],"n2":["n3","n4"],"n5":[None,"n6"],"n3":[None,None],"n4":[None,None],"n6":[None,None]};events=[event(line.id("while (root)"),_state("沿将形成的右链逐节点处理",nodes,_edges([("n1","n2"),("n1","n5"),("n2","n3"),("n2","n4"),("n5","n6")]),{"root":"n1"}),"若有左子树，就把原右子树接到左子树最右节点。",phase="setup")];root="n1";flat=[]
 while root:
  flat.append(root);left,right=children[root]
  if left:
   p=left
   while children[p][1]:p=children[p][1]
   children[p][1]=right;children[root]=[None,left]
   pairs=[(u,v) for u,(l,r) in children.items() for v in (l,r) if v]
   events.append(event([line.id("p->right = root->right"),line.id("root->right = root->left"),line.id("root->left = NULL")],_state(f"把 {root} 的左子树搬到右侧",nodes,_edges(pairs),{"root":root,"p":p},active=[root,p],formula=f"{p}.right={right}"),"左子树最右节点接住原右子树，前序顺序保持。",phase="mutate"))
  root=children[root][1]
 out=[1,2,3,4,5,6];pairs=[(f"n{i}",f"n{i+1}") for i in range(1,6)]
 events.append(event(line.id("root = root->right"),_state("展开为 1→2→3→4→5→6",nodes,_edges(pairs),{"root":None},result=[f"n{i}" for i in range(1,7)],output=out,formula=str(out),status="return"),"所有 left 均为 NULL，right 为前序后继。",phase="return"))
 return _trace(item,events,example,out,algorithm="前驱最右节点原地拼接",invariant="root 之前已形成正确前序右链",aha="左子树最右节点是原右子树的前序直接前驱",time="O(n²) worst",space="O(1)",input_data=example[0])

def build_105(item,code,example):
 line=Lines(code);pre=[3,9,20,15,7];ino=[9,3,15,20,7];pos={v:i for i,v in enumerate(ino)};nodes=[];edges=[];events=[event(line.id("pos[inorder[i]] = i"),_state("建立中序值到下标映射",nodes,edges,{"pos":str(pos)},hash={str(k):v for k,v in pos.items()}),"前序首元素定根，中序下标定左右规模。",phase="setup")]
 def build(pl,pr,il,ir,level,parent=None):
  if pl>pr:return None
  value=pre[pl];k=pos[value];nid=f"n{value}";nodes.append({"id":nid,"value":value,"level":level,"order":k})
  if parent:edges.append({"from":parent,"to":nid})
  events.append(event([line.id("new TreeNode(preorder[pl])"),line.id("int k = pos")],_state(f"前序区间 [{pl},{pr}] 取根 {value}",nodes,edges,{"pl":pl,"pr":pr,"il":il,"ir":ir,"k":k},active=[nid],formula=f"root={value}, inorder index={k}"),"中序根左边属于左子树，右边属于右子树。",phase="mutate"));left_size=k-il;build(pl+1,pl+left_size,il,k-1,level+1,nid);build(pl+left_size+1,pr,k+1,ir,level+1,nid);return nid
 root=build(0,4,0,4,0);output=[3,9,20,None,None,15,7]
 events.append(event(line.id("return root"),_state("返回重建二叉树",nodes,edges,{"root":root},result=[x["id"] for x in nodes],output=output,formula=str(output),status="return"),"前序与中序区间边界均已完整消费。",phase="return"))
 return _trace(item,events,example,output,algorithm="前序定根 + 中序切分",invariant="递归参数描述同一子树在两种遍历中的对应区间",aha="中序根位置给出左子树节点数",time="O(n)",space="O(n)",input_data={"pre":pre,"in":ino})

def build_437(item,code,example):
 line=Lines(code);spec=[("n10",10,0,0),("n5",5,1,0),("nm3",-3,1,1),("n3",3,2,0),("n2",2,2,1),("n11",11,2,2),("n3b",3,3,0),("nm2",-2,3,1),("n1",1,3,2)];nodes=_nodes(spec);pairs=[("n10","n5"),("n10","nm3"),("n5","n3"),("n5","n2"),("nm3","n11"),("n3","n3b"),("n3","nm2"),("n2","n1")];edges=_edges(pairs);ch=defaultdict(list)
 for a,b in pairs:ch[a].append(b)
 vals={x["id"]:x["value"] for x in nodes};cnt={0:1};res=0;events=[event(line.id("cnt[0] ++"),_state("空前缀和 0 出现一次",nodes,edges,{"target":8,"cur":0,"res":0},hash={"0":1}),"它允许从根开始的路径被匹配。",phase="setup")]
 def dfs(u,cur,path):
  nonlocal res
  cur+=vals[u];add=cnt.get(cur-8,0);res+=add
  events.append(event(line.id("res += cnt[cur - sum]"),_state(f"到 {vals[u]} 前缀和 {cur}，新增 {add} 条路径",nodes,edges,{"root":u,"cur":cur,"need":cur-8,"res":res},active=[u],result=path+[u] if add else [],hash={str(k):v for k,v in cnt.items()},formula=f"cnt[{cur}-8]={add}"),"祖先前缀 cur-target 的出现次数就是以当前节点结尾的答案数。",phase="compare"));cnt[cur]=cnt.get(cur,0)+1
  events.append(event(line.id("cnt[cur] ++"),_state(f"记录当前前缀和 {cur}",nodes,edges,{"root":u,"cur":cur,"res":res},active=[u],hash={str(k):v for k,v in cnt.items()}),"哈希只保存当前根到节点路径上的前缀。",phase="mutate"))
  for v in ch[u]:dfs(v,cur,path+[u])
  cnt[cur]-=1
  events.append(event(line.id("cnt[cur] --"),_state(f"离开 {u}，移除前缀和 {cur}",nodes,edges,{"root":u,"cur":cur,"res":res},active=[u],hash={str(k):v for k,v in cnt.items() if v}),"回溯避免兄弟子树共享不在同一路径的前缀。",phase="mutate"))
 dfs("n10",0,[]);events.append(event(line.id("return res"),_state("返回路径条数 3",nodes,edges,{"res":res},result=["n5","n3","n2","n1","nm3","n11"],output=res,formula="return 3",status="return"),"三条向下路径和为 8。",phase="return"))
 return _trace(item,events,example,3,algorithm="DFS 路径前缀和计数",invariant="cnt 只包含当前根到节点路径上的前缀和",aha="路径和 target 等价于寻找祖先前缀 cur-target",time="O(n)",space="O(h)",input_data=example[0])

def build_236(item,code,example):
 line=Lines(code);nodes=_nodes([("n3",3,0,0),("n5",5,1,0),("n1",1,1,1),("n6",6,2,0),("n2",2,2,1),("n0",0,2,2),("n8",8,2,3),("n7",7,3,0),("n4",4,3,1)]);pairs=[("n3","n5"),("n3","n1"),("n5","n6"),("n5","n2"),("n1","n0"),("n1","n8"),("n2","n7"),("n2","n4")];edges=_edges(pairs);ch=defaultdict(list)
 for a,b in pairs:ch[a].append(b)
 ans=None;events=[event(line.id("dfs(root, p, q)"),_state("寻找 p=5 与 q=1 的状态位",nodes,edges,{"p":"n5","q":"n1","ans":None}),"bit0 表示找到 p，bit1 表示找到 q。",phase="setup")]
 def dfs(u):
  nonlocal ans
  state=0
  for v in ch[u]:state|=dfs(v)
  if u=="n5":state|=1
  elif u=="n1":state|=2
  events.append(event([line.id("if (root == p)"),line.id("state |= dfs(root->right")],_state(f"节点 {u} 汇总 state={state}",nodes,edges,{"root":u,"state":state,"ans":ans},active=[u],formula=f"state={state:02b}"),"状态位由左右子树与当前节点按位或得到。",phase="mutate"))
  if state==3 and ans is None:ans=u;events.append(event(line.id("if (state == 3 && !ans)"),_state(f"首次 state=3，LCA={u}",nodes,edges,{"root":u,"state":state,"ans":ans},active=[u],result=[u],formula="state=3"),"后序首次同时包含 p、q 的节点最低。",phase="accept"))
  return state
 dfs("n3");answer=3
 events.append(event(line.id("return ans"),_state("返回最近公共祖先 3",nodes,edges,{"ans":ans},result=[ans],output=answer,formula="return 3",status="return"),"根 3 是首次同时覆盖两目标的节点。",phase="return"))
 return _trace(item,events,example,3,algorithm="后序状态位汇总",invariant="dfs 返回当前子树是否包含 p/q 的两位掩码",aha="首次汇总为 3 的节点就是最低公共祖先",input_data=example[0])

def build_124(item,code,example):
 line=Lines(code);nodes=_nodes([("nm10",-10,0,0),("n9",9,1,0),("n20",20,1,1),("n15",15,2,0),("n7",7,2,1)]);edges=_edges([("nm10","n9"),("nm10","n20"),("n20","n15"),("n20","n7")]);ch={"nm10":("n9","n20"),"n9":(None,None),"n20":("n15","n7"),"n15":(None,None),"n7":(None,None)};vals={x["id"]:x["value"] for x in nodes};ans=-10**9;events=[event(line.id("ans = INT_MIN"),_state("全局最大路径和初始化为负无穷",nodes,edges,{"ans":"-∞"}),"全负树也必须选择至少一个节点。",phase="setup")]
 def dfs(u):
  nonlocal ans
  if not u:return 0
  l=max(0,dfs(ch[u][0]));r=max(0,dfs(ch[u][1]));through=vals[u]+l+r;ans=max(ans,through);up=vals[u]+max(l,r)
  events.append(event([line.id("int left = max"),line.id("ans = max"),line.id("return u->val")],_state(f"节点 {vals[u]}: 左贡献 {l}、右贡献 {r}、经过和 {through}",nodes,edges,{"root":u,"left":l,"right":r,"through":through,"ans":ans,"up":up},active=[u],formula=f"ans=max({through}); up={up}"),"答案可在当前节点拐弯，向父节点只能返回单边。",phase="mutate"));return up
 dfs("nm10");events.append(event(line.id("return ans"),_state("返回最大路径和 42",nodes,edges,{"ans":ans},result=["n15","n20","n7"],output=ans,formula="15+20+7=42",status="return"),"负贡献被截为 0，最优路径经过节点 20。",phase="return"))
 return _trace(item,events,example,42,algorithm="后序单边贡献 + 全局拐点答案",invariant="dfs 返回从当前节点向下的最大单边路径和",aha="全局路径可取左右两边，向上返回时不能分叉",input_data=example[0])

BUILDERS:dict[int,Callable]={94:build_94,98:build_98,101:build_101,102:build_102,104:build_104,105:build_105,108:build_108,114:build_114,124:build_124,199:build_199,226:build_226,230:build_230,236:build_236,437:build_437,543:build_543}

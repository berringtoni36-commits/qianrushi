"""Deterministic linked-list and functional-graph traces."""
from __future__ import annotations
from copy import deepcopy
from heapq import heappop,heappush
from typing import Any,Callable
from series_core import Lines,complete_state,event,make_trace

def _trace(item,scene,events,example,expected,*,algorithm,invariant,aha,time="O(n)",space="O(1)",input_data=None):
 return make_trace(item,scene,events,algorithm=algorithm,invariant=invariant,aha=aha,time=time,space=space,example_text=example[0],expected_text=example[1],input_data=input_data,expected=expected)

def _list_state(action,pool,order,pointers,*,extra_edges=None,active=None,result=None,formula="",output=None,status="running"):
 nodes=[{"id":nid,"value":value} for nid,value in pool]
 edges=[{"from":order[i],"to":order[i+1]} for i in range(len(order)-1)]
 if extra_edges:edges+=deepcopy(extra_edges)
 state=complete_state("linked-list",action,nodes=nodes,edges=edges,pointers=pointers,variables=pointers,active=active or [],result=result or [],formula=formula,status=status)
 if output is not None:state["output"]=output
 return state

def build_160(item,code,example):
 line=Lines(code);pool=[("a4",4),("a1",1),("b5",5),("b6",6),("b1",1),("c8",8),("c4",4),("c5",5)];edges=[{"from":"a4","to":"a1"},{"from":"a1","to":"c8"},{"from":"b5","to":"b6"},{"from":"b6","to":"b1"},{"from":"b1","to":"c8"},{"from":"c8","to":"c4"},{"from":"c4","to":"c5"}];nexts={e["from"]:e["to"] for e in edges};pa="a4";pb="b5";events=[event(line.id("auto p = headA"),_list_state("p、q 分别从两条链表起点出发",pool,[],{"p":pa,"q":pb},extra_edges=edges,active=[pa,pb]),"切换头节点会补齐两条前缀长度差。",phase="setup")]
 for step in range(9):
  if pa==pb:break
  olda,oldb=pa,pb;pa=nexts.get(pa,"b5") if pa is not None else "b5";pb=nexts.get(pb,"a4") if pb is not None else "a4"
  events.append(event([line.id("p = p ?"),line.id("q = q ?")],_list_state(f"双指针同步走第 {step+1} 步",pool,[],{"p":pa,"q":pb},extra_edges=edges,active=[x for x in [pa,pb] if x],formula=f"{olda}→{pa}; {oldb}→{pb}"),"每个指针都将走完 A 前缀+B 前缀。",phase="mutate"))
 events.append(event(line.id("return p"),_list_state("p 与 q 在值 8 的节点相遇",pool,[],{"p":pa,"q":pb},extra_edges=edges,active=["c8"],result=["c8","c4","c5"],output=8,formula="p==q==c8",status="return"),"第一次相同节点就是交点。",phase="return"))
 return _trace(item,"linked-list",events,example,8,algorithm="双指针交换链表头",invariant="p 与 q 已走总路程差始终抵消两前缀长度差",aha="各走 A+B 与 B+A 后会同时到交点",input_data=example[0])

def build_234(item,code,example):
 line=Lines(code);vals=[1,2,2,1];pool=[(f"n{i}",v) for i,v in enumerate(vals)];order=[f"n{i}" for i in range(4)];events=[event(line.id("int n = 0"),_list_state("统计链表长度 4",pool,order,{"head":"n0"},formula="n=4"),"只反转后半段并在结束时恢复。",phase="setup")]
 events.append(event(line.id("for (int i = 0; i < n - half"),_list_state("a 移到后半段尾节点 n3",pool,order,{"head":"n0","a":"n3"},active=["n3"],formula="half=2"),"YXC 代码从尾部向前反转后半段。",phase="inspect"))
 rev=["n3","n2"];events.append(event(line.id("b->next = a"),_list_state("把 n2.next 改为 n3",pool,rev,{"head":"n0","a":"n3","b":"n2"},extra_edges=[{"from":"n0","to":"n1"},{"from":"n1","to":"n2"}],active=["n2","n3"],formula="n2→n3"),"后半段现在按逆序可遍历。",phase="mutate"))
 success=True
 for i,(left,right) in enumerate(zip(["n0","n1"],rev)):
  equal=dict(pool)[left]==dict(pool)[right];success&=equal
  events.append(event(line.id("if (p->val != q->val)"),_list_state(f"比较 {dict(pool)[left]} 与 {dict(pool)[right]}：相等",pool,rev,{"p":left,"q":right,"success":success},extra_edges=[{"from":"n0","to":"n1"},{"from":"n1","to":"n2"}],active=[left,right],formula=str(equal)),"两端对应值逐一比较。",phase="compare"))
 events.append(event(line.id("b->next = a",occurrence=2),_list_state("把后半段恢复原方向",pool,order,{"head":"n0","tail":"n3"},active=["n2","n3"],formula="restore"),"函数返回前恢复调用者链表。",phase="mutate"))
 events.append(event(line.id("return success"),_list_state("返回 true，且链表已恢复",pool,order,{"head":"n0","success":success},result=order,output=success,formula="true",status="return"),"正向与反向前半段完全一致。",phase="return"))
 return _trace(item,"linked-list",events,example,True,algorithm="反转后半段比较并恢复",invariant="比较阶段 q 沿后半段逆序，p 沿前半段正序",aha="回文等价于前半段和反转后半段逐项相等",space="O(1)",input_data=vals)

def _cycle_pool():
 pool=[("n0",3),("n1",2),("n2",0),("n3",-4)];edges=[{"from":"n0","to":"n1"},{"from":"n1","to":"n2"},{"from":"n2","to":"n3"},{"from":"n3","to":"n1"}];nxt={e["from"]:e["to"] for e in edges};return pool,edges,nxt

def build_141(item,code,example):
 line=Lines(code);pool,edges,nxt=_cycle_pool();s="n0";f="n1";events=[event(line.id("auto s = head"),_list_state("慢指针在 n0，快指针在 n1",pool,[],{"s":s,"f":f},extra_edges=edges,active=[s,f]),"快指针每轮比慢指针多走一步。",phase="setup")]
 while True:
  s=nxt[s];f=nxt[nxt[f]];events.append(event([line.id("s = s->next"),line.id("f = f->next",occurrence=2)],_list_state(f"慢到 {s}，快到 {f}",pool,[],{"s":s,"f":f},extra_edges=edges,active=[s,f],formula=f"s==f → {s==f}"),"有环时相对距离每轮减一模环长。",phase="mutate"))
  if s==f:break
 events.append(event(line.id("if (s == f) return true"),_list_state("快慢指针相遇，存在环",pool,[],{"s":s,"f":f},extra_edges=edges,active=[s],result=["n1","n2","n3"],output=True,formula="return true",status="return"),"无环链表快指针会先到 NULL；本例发生相遇。",phase="return"))
 return _trace(item,"linked-list",events,example,True,algorithm="Floyd 快慢指针判环",invariant="每轮 slow 走 1 步、fast 走 2 步",aha="环内相对速度为 1，必然追上",space="O(1)",input_data=example[0])

def build_142(item,code,example):
 line=Lines(code);pool,edges,nxt=_cycle_pool();s="n0";f="n1";events=[event(line.id("auto s = head"),_list_state("快慢指针开始第一阶段",pool,[],{"s":s,"f":f},extra_edges=edges,active=[s,f]),"先在环内相遇，再利用路程关系找入口。",phase="setup")]
 while True:
  s=nxt[s];f=nxt[nxt[f]];events.append(event(line.id("if (s == f)"),_list_state(f"第一阶段：s={s}, f={f}",pool,[],{"s":s,"f":f,"phase":1},extra_edges=edges,active=[s,f],formula=f"meet={s==f}"),"保持 1:2 速度直到相遇。",phase="mutate"))
  if s==f:break
 s="n0";f=nxt[f];events.append(event(line.id("s = head, f = f->next"),_list_state("重置 s 到头，f 额外前进一步",pool,[],{"s":s,"f":f,"phase":2},extra_edges=edges,active=[s,f]),"这份代码初始 fast 比 slow 超前一步，因此相遇后需补偿一步。",phase="inspect"))
 while s!=f:
  s=nxt[s];f=nxt[f];events.append(event(line.id("while (s != f)"),_list_state(f"同速前进：s={s}, f={f}",pool,[],{"s":s,"f":f,"phase":2},extra_edges=edges,active=[s,f],formula=f"same={s==f}"),"两者距离入口相等。",phase="mutate"))
 events.append(event(line.id("return s"),_list_state("在 n1 相遇，返回环入口值 2",pool,[],{"s":s,"f":f},extra_edges=edges,active=[s],result=[s],output=2,formula="entry=2",status="return"),"第二阶段相遇点就是入口。",phase="return"))
 return _trace(item,"linked-list",events,example,2,algorithm="Floyd 两阶段找环入口",invariant="第二阶段两指针到入口的剩余步数相同",aha="相遇路程方程把头到入口距离转化为环内剩余距离",space="O(1)",input_data=example[0])

def build_21(item,code,example):
 line=Lines(code);pool=[("a0",1),("a1",2),("a2",4),("b0",1),("b1",3),("b2",4),("d",-1)];A=["a0","a1","a2"];B=["b0","b1","b2"];out=[];events=[event(line.id("auto dummy = new ListNode"),_list_state("dummy 与 tail 指向哨兵",pool,[],{"tail":"d","l1":A[0],"l2":B[0]},extra_edges=[{"from":A[i],"to":A[i+1]} for i in range(2)]+[{"from":B[i],"to":B[i+1]} for i in range(2)]),"tail 始终指向已合并链尾。",phase="setup")]
 ia=ib=0
 while ia<3 and ib<3:
  chooseA=dict(pool)[A[ia]]<dict(pool)[B[ib]];chosen=A[ia] if chooseA else B[ib];out.append(chosen)
  if chooseA:ia+=1;needle="tail = tail->next = l1"
  else:ib+=1;needle="tail = tail->next = l2"
  events.append(event(line.id(needle),_list_state(f"接入值 {dict(pool)[chosen]}",pool,out,{"tail":chosen,"l1":A[ia] if ia<3 else None,"l2":B[ib] if ib<3 else None},active=[chosen],result=out,formula=f"choose {'l1' if chooseA else 'l2'}"),"每次接入两个当前头中的较小者。",phase="mutate"))
 out+=A[ia:]+B[ib:];values=[dict(pool)[x] for x in out]
 events.append(event(line.id("if (l1) tail->next","if (l2) tail->next"),_list_state("接上剩余有序后缀",pool,out,{"head":out[0]},result=out,formula="append remainder"),"一条链耗尽后另一条可整体接入。",phase="mutate"))
 events.append(event(line.id("return dummy->next"),_list_state("返回合并链 [1,1,2,3,4,4]",pool,out,{"head":out[0]},result=out,output=values,formula=str(values),status="return"),"输出链保持非递减。",phase="return"))
 return _trace(item,"linked-list",events,example,values,algorithm="双链表归并",invariant="dummy.next..tail 是两输入已消费部分的有序合并",aha="比较两个头节点即可确定全局下一个最小值",space="O(1)",input_data=[[1,2,4],[1,3,4]])

def build_2(item,code,example):
 line=Lines(code);a=[2,4,3];b=[5,6,4];carry=0;out=[];pool=[];events=[event(line.id("int t = 0"),_list_state("进位 t=0，结果链为空",[],[],{"l1":"2","l2":"5","cur":"dummy","t":0}),"每轮处理同一十进制位。",phase="setup")]
 i=0
 while i<len(a) or i<len(b) or carry:
  x=a[i] if i<len(a) else 0;y=b[i] if i<len(b) else 0;total=carry+x+y
  events.append(event([line.id("if (l1) t +="),line.id("if (l2) t +=")],complete_state("linked-list",f"第 {i} 位求和 {x}+{y}+进位={total}",nodes=[{"id":f"r{k}","value":v} for k,v in enumerate(out)],edges=[{"from":f"r{k}","to":f"r{k+1}"} for k in range(max(0,len(out)-1))],pointers={"digit":i},variables={"i":i,"x":x,"y":y,"t":total},active=[],result=[],formula=f"{x}+{y}+{carry}={total}"),"低位结果与新进位由 total 同时决定。",phase="compare"))
  digit=total%10;carry=total//10;out.append(digit);pool=[(f"r{k}",v) for k,v in enumerate(out)]
  events.append(event([line.id("new ListNode(t % 10)"),line.id("t /= 10")],_list_state(f"写入 {digit}，进位变 {carry}",pool,[x for x,_ in pool],{"cur":f"r{len(out)-1}","t":carry},active=[f"r{len(out)-1}"],result=[x for x,_ in pool],formula=f"digit={digit}, carry={carry}"),"结果链按低位到高位追加。",phase="mutate"));i+=1
 events.append(event(line.id("return dummy->next"),_list_state("返回 [7,0,8]",pool,[x for x,_ in pool],{"head":"r0"},result=[x for x,_ in pool],output=out,formula="342+465=807",status="return"),"逆序链表正好允许从个位开始计算。",phase="return"))
 return _trace(item,"linked-list",events,example,out,algorithm="逐位加法与进位",invariant="结果链保存已处理低位，t 保存下一位进位",aha="逆序存储让链表遍历顺序与手算加法一致",space="O(max(m,n))",input_data=[a,b])

def build_19(item,code,example):
 line=Lines(code);vals=[1,2,3,4,5];pool=[("d",-1)]+[(f"n{i}",v) for i,v in enumerate(vals)];order=["d"]+[f"n{i}" for i in range(5)];events=[event(line.id("dummy->next = head"),_list_state("哨兵接到原头节点",pool,order,{"dummy":"d","head":"n0","k":2}),"哨兵让删除头节点也使用统一前驱逻辑。",phase="setup")]
 for count,node in enumerate(order):events.append(event(line.id("for (auto p = dummy"),_list_state(f"计数访问 {node}",pool,order,{"p":node,"n":count+1,"k":2},active=[node],formula=f"n={count+1}"),"代码统计包含 dummy 的节点数。",phase="inspect"))
 p_index=len(order)-2-1;pred=order[p_index];removed=order[p_index+1]
 events.append(event(line.id("for (int i = 0; i < n - k - 1"),_list_state(f"p 移到待删节点前驱 {pred}",pool,order,{"p":pred,"k":2},active=[pred,removed]),"前驱位置由包含 dummy 的总长度计算。",phase="inspect"))
 new_order=[x for x in order if x!=removed];out=[dict(pool)[x] for x in new_order if x!="d"]
 events.append(event(line.id("p->next = p->next->next"),_list_state(f"跳过节点 {removed}",pool,new_order,{"p":pred,"removed":removed},active=[pred],result=new_order[1:],formula=f"{pred}.next bypass {removed}"),"只改一条 next 边完成删除。",phase="mutate"))
 events.append(event(line.id("return dummy->next"),_list_state("返回 [1,2,3,5]",pool,new_order,{"head":"n0"},result=new_order[1:],output=out,formula=str(out),status="return"),"倒数第 2 个值 4 已移除。",phase="return"))
 return _trace(item,"linked-list",events,example,out,algorithm="计数后定位删除前驱",invariant="p 最终停在待删除节点的直接前驱",aha="引入 dummy 后删除任何位置都归结为改前驱 next",space="O(1)",input_data={"list":vals,"n":2})

def build_24(item,code,example):
 line=Lines(code);vals=[1,2,3,4];pool=[("d",-1)]+[(f"n{i}",v) for i,v in enumerate(vals)];order=["d","n0","n1","n2","n3"];events=[event(line.id("dummy->next = head"),_list_state("p 从 dummy 开始",pool,order,{"p":"d"}),"每轮交换 p 后面的两个节点。",phase="setup")]
 pidx=0
 while pidx+2<len(order):
  p,a,b=order[pidx:pidx+3];events.append(event(line.id("auto a = p->next"),_list_state(f"锁定一对 {dict(pool)[a]},{dict(pool)[b]}",pool,order,{"p":p,"a":a,"b":b},active=[a,b]),"先保存三个指针再改边。",phase="inspect"))
  order[pidx+1:pidx+3]=[b,a]
  events.append(event([line.id("p->next = b"),line.id("a->next = b->next"),line.id("b->next = a")],_list_state("三次改边完成本对交换",pool,order,{"p":a,"a":a,"b":b},active=[a,b],result=order[1:pidx+3],formula=f"{dict(pool)[b]}→{dict(pool)[a]}"),"交换后 a 成为下一轮前驱。",phase="mutate"));pidx+=2
 out=[dict(pool)[x] for x in order[1:]];events.append(event(line.id("return dummy->next"),_list_state("返回 [2,1,4,3]",pool,order,{"head":order[1]},result=order[1:],output=out,formula=str(out),status="return"),"每对节点内部次序翻转，组间次序不变。",phase="return"))
 return _trace(item,"linked-list",events,example,out,algorithm="哨兵 + 三边重连",invariant="p 之前链表已完成两两交换",aha="每组交换需要按 p→b、a→next、b→a 重连",space="O(1)",input_data=vals)

def build_25(item,code,example):
 line=Lines(code);vals=[1,2,3,4,5];pool=[("d",-1)]+[(f"n{i}",v) for i,v in enumerate(vals)];order=["d"]+[f"n{i}" for i in range(5)];k=2;events=[event(line.id("dummy->next = head"),_list_state("按 2 个节点划分分组",pool,order,{"p":"d","k":k}),"不足 k 个的尾组保持原序。",phase="setup")];start=1
 while start+k<=len(order):
  group=order[start:start+k];events.append(event(line.id("for (int i = 0; i < k && q"),_list_state(f"确认完整分组 {group}",pool,order,{"p":order[start-1],"q":group[-1],"k":k},active=group),"q 走 k 步成功才允许翻转。",phase="inspect"))
  order[start:start+k]=reversed(group)
  events.append(event([line.id("b->next = a"),line.id("p->next = a, c->next = b")],_list_state("组内翻转并接回前后链",pool,order,{"p":group[0],"group":start//k+1},active=group,result=order[1:start+k],formula=f"reverse {group}"),"保存组后继后完成反转，再把头尾接回。",phase="mutate"));start+=k
 out=[dict(pool)[x] for x in order[1:]];events.append(event(line.id("return dummy->next"),_list_state("返回 [2,1,4,3,5]",pool,order,{"head":order[1]},result=order[1:],output=out,formula=str(out),status="return"),"最后单节点不足一组，保持不变。",phase="return"))
 return _trace(item,"linked-list",events,example,out,algorithm="逐组检查与原地反转",invariant="p 之前都是完整翻转组，p 之后尚未处理",aha="先用 q 验证组长，防止翻转不足 k 的尾段",time="O(n)",space="O(1)",input_data={"list":vals,"k":k})

def build_138(item,code,example):
 line=Lines(code);vals=[7,13,11,10,1];pool=[(f"o{i}",v) for i,v in enumerate(vals)];order=[];events=[event(line.id("for (auto p = head; p; p = p->next->next)"),_list_state("原链包含 5 个带 random 的节点",pool,[x for x,_ in pool],{"p":"o0"}),"复制节点先交错插入原节点之后。",phase="setup")]
 for i,v in enumerate(vals):
  cid=f"c{i}";pool.append((cid,v));pos=order.index(f"o{i}")+1 if order else 0
  if not order:order=["o0","c0","o1","o2","o3","o4"]
  elif cid not in order:order.insert(order.index(f"o{i}")+1,cid)
  events.append(event([line.id("auto q = new Node"),line.id("p->next = q")],_list_state(f"在 o{i} 后插入克隆 c{i}",pool,order,{"p":f"o{i}","q":cid},active=[f"o{i}",cid],formula=f"clone {v}"),"克隆节点紧邻原节点，使 random 复制可 O(1) 找到。",phase="mutate"))
 random_to=[None,0,4,2,0]
 for i,target in enumerate(random_to):
  if target is None:continue
  events.append(event(line.id("p->next->random = p->random->next"),_list_state(f"c{i}.random 指向 c{target}",pool,order,{"p":f"o{i}","clone":f"c{i}"},extra_edges=[{"from":f"c{i}","to":f"c{target}","status":"active"}],active=[f"c{i}",f"c{target}"],formula=f"c{i}.random=c{target}"),"原 random 目标的 next 就是对应克隆。",phase="mutate"))
 clone_order=[f"c{i}" for i in range(5)];events.append(event(line.id("p->next = q->next"),_list_state("拆开原链与克隆链",pool,clone_order,{"head":"c0"},result=clone_order,formula="unweave"),"逐个恢复原 next，并把克隆接入新链。",phase="mutate"))
 expected=random_to
 events.append(event(line.id("return dummy->next"),_list_state("返回 random 关系完全一致的克隆链",pool,clone_order,{"head":"c0"},result=clone_order,output=expected,formula=str(expected),status="return"),"克隆链 next 与 random 均不引用原节点。",phase="return"))
 return _trace(item,"linked-list",events,example,expected,algorithm="原地交错复制",invariant="交错阶段每个原节点 next 恰好是自己的克隆",aha="借助相邻克隆把 random 映射从哈希降为 O(1)",time="O(n)",space="O(1)",input_data=example[0])

def build_148(item,code,example):
 line=Lines(code);vals=[4,2,1,3];pool=[(f"n{i}",v) for i,v in enumerate(vals)];order=[x for x,_ in pool];events=[event(line.id("for (int i = 1; i < n; i *= 2)"),_list_state("自底向上从长度 1 子链开始",pool,order,{"width":1}),"每轮把相邻等长有序子链归并。",phase="setup")]
 width=1
 while width<len(order):
  merged=[]
  for start in range(0,len(order),2*width):
   left=order[start:start+width];right=order[start+width:start+2*width];i=j=0;chunk=[]
   while i<len(left) or j<len(right):
    take_left=j==len(right) or (i<len(left) and dict(pool)[left[i]]<=dict(pool)[right[j]])
    node=left[i] if take_left else right[j]
    if take_left:i+=1
    else:j+=1
    chunk.append(node);events.append(event(line.id("if (p->val <= q->val)","else cur = cur->next = q"),_list_state(f"宽度 {width} 归并接入值 {dict(pool)[node]}",pool,merged+chunk+order[start+len(left)+len(right):],{"width":width,"tail":node},active=[node],result=merged+chunk,formula=f"take {node}"),"两个子链头中较小者是下一节点。",phase="mutate"))
   merged+=chunk
  order=merged;width*=2
  events.append(event(line.id("head = dummy->next"),_list_state(f"完成一轮，下一子链宽度 {width}",pool,order,{"width":width,"head":order[0]},result=order,formula=str([dict(pool)[x] for x in order])),"本轮结束后每段长度 width 的子链有序。",phase="accept"))
 out=[dict(pool)[x] for x in order];events.append(event(line.id("return head"),_list_state("返回排序链 [1,2,3,4]",pool,order,{"head":order[0]},result=order,output=out,formula=str(out),status="return"),"最后一轮得到整条有序链。",phase="return"))
 return _trace(item,"linked-list",events,example,out,algorithm="自底向上归并排序",invariant="宽度 i 轮开始时每个长度 i 子链内部有序",aha="链表归并只改 next，无需随机访问",time="O(n log n)",space="O(1)",input_data=vals)

def build_23(item,code,example):
 line=Lines(code);lists=[[1,4,5],[1,3,4],[2,6]];heap=[];positions=[0,0,0];out=[];events=[event(line.id("priority_queue<ListNode*"),complete_state("heap","把三条链表头加入小根堆",values=[str(x) for x in lists],heap=[1,1,2],variables={"k":3},output=[]),"堆顶是所有未合并节点中的最小值。",phase="setup")]
 for idx,lst in enumerate(lists):heappush(heap,(lst[0],idx))
 while heap:
  value,idx=heappop(heap);out.append(value);positions[idx]+=1
  events.append(event([line.id("heap.pop()"),line.id("tail = tail->next = t")],complete_state("heap",f"弹出并接入 {value}",values=[str(x) for x in lists],heap=[v for v,_ in sorted(heap)],variables={"list":idx,"value":value},output=out.copy(),formula=str(out)),"接入节点来自当前所有链头的最小值。",phase="accept"))
  if positions[idx]<len(lists[idx]):
   nxt=lists[idx][positions[idx]];heappush(heap,(nxt,idx));events.append(event(line.id("if (t->next) heap.push"),complete_state("heap",f"该链下一个值 {nxt} 入堆",values=[str(x) for x in lists],heap=[v for v,_ in sorted(heap)],variables={"list":idx,"next":nxt},output=out.copy(),formula=f"push {nxt}"),"每条链在堆中最多保留一个头节点。",phase="mutate"))
 events.append(event(line.id("return dummy->next"),complete_state("heap","返回合并序列",values=out,heap=[],variables={"count":len(out)},result=list(range(len(out))),output=out,formula=str(out),status="return"),"八个节点按升序全部接入。",phase="return"))
 return _trace(item,"heap",events,example,out,algorithm="K 路归并小根堆",invariant="堆中恰好保存每条未耗尽链的当前头",aha="全局最小节点一定在各链头之中",time="O(N log k)",space="O(k)",input_data=lists)

def build_287(item,code,example):
 line=Lines(code);nums=[1,3,4,2,2];a=b=0;events=[event(line.id("int a = 0, b = 0"),complete_state("array-pointers","把下标视为节点，nums[i] 视为 next",values=nums,variables={"a":a,"b":b},pointers={"a":a,"b":b}),"重复值对应函数图中两条边汇入同一节点，从而形成环。",phase="setup")]
 while True:
  a=nums[a];b=nums[nums[b]];events.append(event([line.id("a = nums[a]"),line.id("b = nums[nums[b]]")],complete_state("array-pointers",f"慢指针到 {a}，快指针到 {b}",values=nums,variables={"a":a,"b":b,"phase":1},pointers={"a":a,"b":b},active=[a,b],formula=f"meet={a==b}"),"第一阶段在环内相遇。",phase="mutate"))
  if a==b:break
 a=0;events.append(event(line.id("a = 0"),complete_state("array-pointers","慢指针重置到 0",values=nums,variables={"a":a,"b":b,"phase":2},pointers={"a":a,"b":b}),"头到入口距离等于相遇点到入口的剩余距离。",phase="inspect"))
 while a!=b:
  a=nums[a];b=nums[b];events.append(event([line.id("a = nums[a]",occurrence=2),line.id("b = nums[b]")],complete_state("array-pointers",f"同速前进：a={a}, b={b}",values=nums,variables={"a":a,"b":b,"phase":2},pointers={"a":a,"b":b},active=[a,b],formula=f"same={a==b}"),"第二阶段相遇于环入口。",phase="mutate"))
 events.append(event(line.id("return a"),complete_state("array-pointers","返回重复数 2",values=nums,variables={"a":a,"b":b},pointers={"a":a,"b":b},result=[a],output=a,formula="return 2",status="return"),"环入口的节点编号就是重复值。",phase="return"))
 return _trace(item,"array-pointers",events,example,2,algorithm="Floyd 函数图找环入口",invariant="指针每步严格按 nums 映射前进",aha="重复值把数组映射变成带环链表",time="O(n)",space="O(1)",input_data=nums)

BUILDERS:dict[int,Callable]={2:build_2,19:build_19,21:build_21,23:build_23,24:build_24,25:build_25,138:build_138,141:build_141,142:build_142,148:build_148,160:build_160,234:build_234,287:build_287}

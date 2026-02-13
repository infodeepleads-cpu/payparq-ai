((a,b)=>{a[b]=a[b]||{}})(self,"$__dart_deferred_initializers__")
$__dart_deferred_initializers__.current=function(a,b,c,$){var B,C,A={aF8:function aF8(d,e,f,g){var _=this
_.a=d
_.b=e
_.c=f
_.d=g},aF9:function aF9(){},MV:function MV(d,e,f,g,h,i){var _=this
_.a=d
_.b=e
_.c=f
_.d=g
_.e=h
_.f=i},a2q:function a2q(){},CN:function CN(d,e,f){var _=this
_.b=_.w=null
_.c=!1
_.xa$=d
_.d6$=e
_.aF$=f
_.a=null},a18:function a18(d,e,f,g,h,i,j){var _=this
_.eB=d
_.y1=e
_.y2=f
_.cE$=g
_.af$=h
_.d7$=i
_.b=_.dy=null
_.c=0
_.y=_.d=null
_.z=!0
_.Q=null
_.as=!1
_.at=null
_.ay=$
_.ch=j
_.CW=!1
_.cx=$
_.cy=!0
_.db=!1
_.dx=$},AU:function AU(d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t){var _=this
_.rx=d
_.ry=e
_.db=f
_.c=g
_.d=h
_.e=i
_.f=j
_.r=k
_.x=l
_.Q=m
_.as=n
_.ax=o
_.ay=p
_.ch=q
_.CW=r
_.cx=s
_.a=t},a2p:function a2p(d,e,f){this.f=d
this.d=e
this.a=f}}
B=c[0]
C=c[2]
A=a.updateHolder(c[41],A)
A.aF8.prototype={
aem(d){var x=this.c
return d.Az(this.d,x,x)},
j(d){var x=this
return"SliverGridGeometry("+C.l.bm(B.b(["scrollOffset: "+B.j(x.a),"crossAxisOffset: "+B.j(x.b),"mainAxisExtent: "+B.j(x.c),"crossAxisExtent: "+B.j(x.d)],y.x),", ")+")"}}
A.aF9.prototype={}
A.MV.prototype={
aeJ(d){var x=this.b
if(x>0)return Math.max(0,this.a*C.o.hW(d/x)-1)
return 0},
asE(d){var x,w,v=this
if(v.f){x=v.c
w=v.e
return v.a*x-d-w-(x-w)}return d},
KS(d){var x=this,w=x.a,v=C.t.aH(d,w)
return new A.aF8(C.t.j_(d,w)*x.b,x.asE(v*x.c),x.d,x.e)},
a8h(d){var x
if(d===0)return 0
x=this.b
return x*(C.t.j_(d-1,this.a)+1)-(x-this.d)}}
A.a2q.prototype={}
A.CN.prototype={
j(d){return"crossAxisOffset="+B.j(this.w)+"; "+this.aj7(0)}}
A.a18.prototype={
fg(d){if(!(d.b instanceof A.CN))d.b=new A.CN(!1,null,null)},
safg(d){var x=this
if(x.eB===d)return
if(B.F(d)!==B.F(x.eB)||d.kQ(x.eB))x.a1()
x.eB=d},
wv(d){var x=d.b
x.toString
x=y.t.a(x).w
x.toString
return x},
bv(){var x,w,v,u,t,s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,a0,a1,a2,a3,a4,a5,a6=this,a7=null,a8=y.z.a(B.G.prototype.ga0.call(a6)),a9=a6.y1
a9.R8=!1
x=a8.d
w=x+a8.z
v=w+a8.Q
u=a6.eB.DC(a8)
t=u.b
s=t>1e-10?u.a*C.o.j_(w,t):0
r=isFinite(v)?u.aeJ(v):a7
if(a6.af$!=null){q=a6.a7U(s)
a6.ts(q,r!=null?a6.a7W(r):0)}else a6.ts(0,0)
p=u.KS(s)
if(a6.af$==null)if(!a6.Qk(s,p.a)){o=u.a8h(a9.gwu())
a6.dy=B.lT(a7,!1,a7,a7,o,0,0,o,a7)
a9.tG()
return}n=p.a
m=n+p.c
t=a6.af$
t.toString
t=t.b
t.toString
l=y.c
t=l.a(t).b
t.toString
k=t-1
t=y.t
j=a7
for(;k>=s;--k){i=u.KS(k)
h=i.c
g=a6.aaM(a8.Az(i.d,h,h))
f=g.b
f.toString
t.a(f)
e=i.a
f.a=e
f.w=i.b
if(j==null)j=g
m=Math.max(m,e+h)}if(j==null){h=a6.af$
h.toString
h.h5(p.aem(a8))
j=a6.af$
h=j.b
h.toString
t.a(h)
h.a=n
h.w=p.b}h=j.b
h.toString
h=l.a(h).b
h.toString
k=h+1
h=B.k(a6).i("an.1")
f=r!=null
for(;;){if(!(!f||k<=r)){d=!1
break}i=u.KS(k)
e=i.c
a0=a8.Az(i.d,e,e)
a1=j.b
a1.toString
g=h.a(a1).aF$
if(g!=null){a1=g.b
a1.toString
a1=l.a(a1).b
a1.toString
a1=a1!==k}else a1=!0
if(a1){g=a6.aaK(a0,j)
if(g==null){d=!0
break}}else g.h5(a0)
a1=g.b
a1.toString
t.a(a1)
a2=i.a
a1.a=a2
a1.w=i.b
m=Math.max(m,a2+e);++k
j=g}t=a6.d7$
t.toString
t=t.b
t.toString
t=l.a(t).b
t.toString
a3=d?m:a9.S5(a8,s,t,n,m)
a4=a6.AG(a8,Math.min(x,n),m)
a5=a6.H2(a8,n,m)
a6.dy=B.lT(a5,a3>a4||x>0||a8.f!==0,a7,a7,a3,a4,0,a3,a7)
if(a3===m)a9.R8=!0
a9.tG()}}
A.AU.prototype={
a7E(d){return new A.a2p(this.rx,this.ry,null)}}
A.a2p.prototype={
aQ(d){var x=new A.a18(this.f,y.v.a(d),B.y(y.e,y.g),0,null,null,B.ao(y.d))
x.aP()
return x},
aW(d,e){e.safg(this.f)},
S4(d,e,f,g,h){var x
this.aj8(d,e,f,g,h)
x=this.f.DC(d).a8h(this.d.gwX())
return x}}
var z=a.updateTypes([]);(function inheritance(){var x=a.inheritMany,w=a.inherit
x(B.C,[A.aF8,A.aF9,A.a2q])
w(A.MV,A.aF9)
w(A.CN,B.hB)
w(A.a18,B.on)
w(A.AU,B.GR)
w(A.a2p,B.n5)})()
B.dl(b.typeUniverse,JSON.parse('{"CN":{"hB":[],"qC":[],"f2":["L"],"mK":[],"du":[]},"a18":{"on":[],"dv":[],"an":["L","hB"],"G":[],"ax":[],"an.1":"hB","an.0":"L"},"AU":{"av":[],"e":[]},"a2p":{"n5":[],"ay":[],"e":[]}}'))
var y={d:B.O("dN"),x:B.O("o<f>"),g:B.O("L"),z:B.O("n4"),t:B.O("CN"),v:B.O("u7"),c:B.O("hB"),e:B.O("l")}};
(a=>{a["ilQPatOYNR5BbSxN731vAX/GOiU="]=a.current})($__dart_deferred_initializers__);
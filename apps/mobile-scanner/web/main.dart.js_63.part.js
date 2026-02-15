((a,b)=>{a[b]=a[b]||{}})(self,"$__dart_deferred_initializers__")
$__dart_deferred_initializers__.current=function(a,b,c,$){var B,C,A={LC:function LC(d,e,f,g){var _=this
_.E=d
_.C$=e
_.dy=f
_.b=_.fy=null
_.c=0
_.y=_.d=null
_.z=!0
_.Q=null
_.as=!1
_.at=null
_.ay=$
_.ch=g
_.CW=!1
_.cx=$
_.cy=!0
_.db=!1
_.dx=$},rq:function rq(d,e){this.a=d
this.b=e},v9:function v9(d,e,f){this.e=d
this.c=e
this.a=f},
b7t(d,e,f,g,h,i,j){var x,w=null,v=e!=null?new B.aL(e,w,w,w,w,w,C.Y):w
if(j!=null||i!=null){x=f==null?w:f.D2(i,j)
if(x==null)x=B.kn(i,j)}else x=f
return new A.G4(d,v,x,g,h,w,w)},
vg:function vg(d,e){this.a=d
this.b=e},
wQ:function wQ(d,e){this.a=d
this.b=e},
G4:function G4(d,e,f,g,h,i,j){var _=this
_.r=d
_.y=e
_.Q=f
_.c=g
_.d=h
_.e=i
_.a=j},
a4v:function a4v(d,e){var _=this
_.fx=_.fr=_.dy=_.dx=_.db=_.cy=_.cx=_.CW=null
_.e=_.d=$
_.dc$=d
_.br$=e
_.c=_.a=null},
aKU:function aKU(){},
aKV:function aKV(){},
aKW:function aKW(){},
aKX:function aKX(){},
aKY:function aKY(){},
aKZ:function aKZ(){},
aL_:function aL_(){},
aL0:function aL0(){},
bgG(){var x=new Float64Array(4)
x[3]=1
return new A.qs(x)},
qs:function qs(d){this.a=d}}
B=c[0]
C=c[2]
A=a.updateHolder(c[28],A)
A.LC.prototype={
sGV(d){if(this.E===d)return
this.E=d
this.a1()},
bg(d){var x
if(isFinite(d))return d*this.E
x=this.C$
x=x==null?null:x.am(C.bB,d,x.gbF())
return x==null?0:x},
be(d){var x
if(isFinite(d))return d*this.E
x=this.C$
x=x==null?null:x.am(C.b5,d,x.gbq())
return x==null?0:x},
bf(d){var x
if(isFinite(d))return d/this.E
x=this.C$
x=x==null?null:x.am(C.bC,d,x.gbE())
return x==null?0:x},
bd(d){var x
if(isFinite(d))return d/this.E
x=this.C$
x=x==null?null:x.am(C.bT,d,x.gbM())
return x==null?0:x},
anb(d){var x,w,v,u,t=d.a,s=d.b
if(t>=s&&d.c>=d.d)return new B.z(B.K(0,t,s),B.K(0,d.c,d.d))
x=this.E
if(isFinite(s)){w=s/x
v=s}else{w=d.d
v=w*x}if(v>s)w=s/x
else s=v
u=d.d
if(w>u){s=u*x
w=u}if(s<t)w=t/x
else t=s
u=d.c
if(w<u){t=u*x
w=u}return d.b9(new B.z(t,w))},
cc(d){return this.anb(d)},
dI(d,e){return this.Xj(B.lf(this.am(C.ar,d,this.gc6())),e)},
bv(){var x,w=this
w.fy=w.am(C.ar,y.k.a(B.G.prototype.ga0.call(w)),w.gc6())
x=w.C$
if(x!=null)x.h5(B.lf(w.gv()))}}
A.rq.prototype={
eO(d){return B.v7(this.a,this.b,d)}}
A.v9.prototype={
aQ(d){var x=new A.LC(this.e,null,new B.aU(),B.ao(y.v))
x.aP()
x.sb6(null)
return x},
aW(d,e){e.sGV(this.e)}}
A.vg.prototype={
eO(d){var x=B.ko(this.a,this.b,d)
x.toString
return x}}
A.wQ.prototype={
eO(a8){var x,w,v,u,t,s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,a0,a1,a2=new B.ev(new Float64Array(3)),a3=new B.ev(new Float64Array(3)),a4=A.bgG(),a5=A.bgG(),a6=new B.ev(new Float64Array(3)),a7=new B.ev(new Float64Array(3))
this.a.a8Q(a2,a4,a6)
this.b.a8Q(a3,a5,a7)
x=1-a8
w=a2.o_(x).U(0,a3.o_(a8))
v=a4.o_(x).U(0,a5.o_(a8))
u=new Float64Array(4)
t=new A.qs(u)
t.cP(v)
t.Cn()
s=a6.o_(x).U(0,a7.o_(a8))
x=new Float64Array(16)
v=new B.bb(x)
r=u[0]
q=u[1]
p=u[2]
o=u[3]
n=r+r
m=q+q
l=p+p
k=r*n
j=r*m
i=r*l
h=q*m
g=q*l
f=p*l
e=o*n
d=o*m
a0=o*l
a1=w.a
x[0]=1-(h+f)
x[1]=j+a0
x[2]=i-d
x[3]=0
x[4]=j-a0
x[5]=1-(k+f)
x[6]=g+e
x[7]=0
x[8]=i+d
x[9]=g-e
x[10]=1-(k+h)
x[11]=0
x[12]=a1[0]
x[13]=a1[1]
x[14]=a1[2]
x[15]=1
x=s.a
v.pt(x[0],x[1],x[2],1)
return v}}
A.G4.prototype={
a4(){return new A.a4v(null,null)}}
A.a4v.prototype={
nr(d){var x,w,v,u=this,t=null,s=u.CW
u.a.toString
x=y.K
u.CW=x.a(d.$3(s,t,new A.aKU()))
s=u.cx
u.a.toString
w=y.Z
u.cx=w.a(d.$3(s,t,new A.aKV()))
s=y.h
u.cy=s.a(d.$3(u.cy,u.a.y,new A.aKW()))
v=u.db
u.a.toString
u.db=s.a(d.$3(v,t,new A.aKX()))
u.dx=y.E.a(d.$3(u.dx,u.a.Q,new A.aKY()))
v=u.dy
u.a.toString
u.dy=w.a(d.$3(v,t,new A.aKZ()))
v=u.fr
u.a.toString
u.fr=y.e.a(d.$3(v,t,new A.aL_()))
v=u.fx
u.a.toString
u.fx=x.a(d.$3(v,t,new A.aL0()))},
I(d){var x,w,v,u,t,s,r,q=this,p=null,o=q.gfk(),n=q.CW
n=n==null?p:n.a6(o.gn())
x=q.cx
x=x==null?p:x.a6(o.gn())
w=q.cy
w=w==null?p:w.a6(o.gn())
v=q.db
v=v==null?p:v.a6(o.gn())
u=q.dx
u=u==null?p:u.a6(o.gn())
t=q.dy
t=t==null?p:t.a6(o.gn())
s=q.fr
s=s==null?p:s.a6(o.gn())
r=q.fx
r=r==null?p:r.a6(o.gn())
return B.aG(n,q.a.r,C.L,p,u,w,v,p,p,t,x,s,r,p)}}
A.qs.prototype={
cP(d){var x=d.a,w=this.a,v=x[0]
w.$flags&2&&B.a5(w)
w[0]=v
w[1]=x[1]
w[2]=x[2]
w[3]=x[3]},
afN(d){var x,w,v,u,t,s=d.a,r=s[0],q=s[4],p=s[8],o=0+r+q+p
if(o>0){x=Math.sqrt(o+1)
r=this.a
r.$flags&2&&B.a5(r)
r[3]=x*0.5
x=0.5/x
r[0]=(s[5]-s[7])*x
r[1]=(s[6]-s[2])*x
r[2]=(s[1]-s[3])*x}else{if(r<q)w=q<p?2:1
else w=r<p?2:0
v=(w+1)%3
u=(w+2)%3
r=w*3
q=v*3
p=u*3
x=Math.sqrt(s[r+w]-s[q+v]-s[p+u]+1)
t=this.a
t.$flags&2&&B.a5(t)
t[w]=x*0.5
x=0.5/x
t[3]=(s[q+u]-s[p+v])*x
t[v]=(s[r+v]+s[q+w])*x
t[u]=(s[r+u]+s[p+w])*x}},
Cn(){var x,w,v,u=Math.sqrt(this.gCb())
if(u===0)return 0
x=1/u
w=this.a
v=w[0]
w.$flags&2&&B.a5(w)
w[0]=v*x
w[1]=w[1]*x
w[2]=w[2]*x
w[3]=w[3]*x
return u},
gCb(){var x=this.a,w=x[0],v=x[1],u=x[2],t=x[3]
return w*w+v*v+u*u+t*t},
gD(d){var x=this.a,w=x[0],v=x[1],u=x[2],t=x[3]
return Math.sqrt(w*w+v*v+u*u+t*t)},
o_(d){var x=new Float64Array(4),w=new A.qs(x)
w.cP(this)
x[3]=x[3]*d
x[2]=x[2]*d
x[1]=x[1]*d
x[0]=x[0]*d
return w},
ab(a5,a6){var x,w,v,u,t,s,r,q,p,o,n,m,l,k,j,i,h=this.a,g=h[3],f=h[2],e=h[1],d=h[0],a0=a6.gaVD(),a1=a0[3],a2=a0[2],a3=a0[1],a4=a0[0]
h=C.o.ab(g,a4)
x=C.o.ab(d,a1)
w=C.o.ab(e,a2)
v=C.o.ab(f,a3)
u=C.o.ab(g,a3)
t=C.o.ab(e,a1)
s=C.o.ab(f,a4)
r=C.o.ab(d,a2)
q=C.o.ab(g,a2)
p=C.o.ab(f,a1)
o=C.o.ab(d,a3)
n=C.o.ab(e,a4)
m=C.o.ab(g,a1)
l=C.o.ab(d,a4)
k=C.o.ab(e,a3)
j=C.o.ab(f,a2)
i=new Float64Array(4)
i[0]=h+x+w-v
i[1]=u+t+s-r
i[2]=q+p+o-n
i[3]=m-l-k-j
return new A.qs(i)},
k(d,e){var x,w,v
if(e==null)return!1
if(e instanceof A.qs){x=this.a
w=x[3]
v=e.a
x=w===v[3]&&x[2]===v[2]&&x[1]===v[1]&&x[0]===v[0]}else x=!1
return x},
gt(d){return B.ch(this.a)},
U(d,e){var x,w=new Float64Array(4),v=new A.qs(w)
v.cP(this)
x=e.a
w[0]=w[0]+x[0]
w[1]=w[1]+x[1]
w[2]=w[2]+x[2]
w[3]=w[3]+x[3]
return v},
Y(d,e){var x,w=new Float64Array(4),v=new A.qs(w)
v.cP(this)
x=e.a
w[0]=w[0]-x[0]
w[1]=w[1]-x[1]
w[2]=w[2]-x[2]
w[3]=w[3]-x[3]
return v},
h(d,e){return this.a[e]},
m(d,e,f){var x=this.a
x.$flags&2&&B.a5(x)
x[e]=f},
j(d){var x=this.a
return B.j(x[0])+", "+B.j(x[1])+", "+B.j(x[2])+" @ "+B.j(x[3])}}
var z=a.updateTypes(["w(w)","rq(@)","vg(@)","wQ(@)"])
A.aKU.prototype={
$1(d){return new A.rq(y.D.a(d),null)},
$S:z+1}
A.aKV.prototype={
$1(d){return new B.nP(y.W.a(d),null)},
$S:130}
A.aKW.prototype={
$1(d){return new B.pz(y.S.a(d),null)},
$S:298}
A.aKX.prototype={
$1(d){return new B.pz(y.S.a(d),null)},
$S:298}
A.aKY.prototype={
$1(d){return new A.vg(y.k.a(d),null)},
$S:z+2}
A.aKZ.prototype={
$1(d){return new B.nP(y.W.a(d),null)},
$S:130}
A.aL_.prototype={
$1(d){return new A.wQ(y.w.a(d),null)},
$S:z+3}
A.aL0.prototype={
$1(d){return new A.rq(y.D.a(d),null)},
$S:z+1};(function installTearOffs(){var x=a._instance_1u
var w
x(w=A.LC.prototype,"gbF","bg",0)
x(w,"gbq","be",0)
x(w,"gbE","bf",0)
x(w,"gbM","bd",0)})();(function inheritance(){var x=a.inherit,w=a.inheritMany
x(A.LC,B.xu)
w(B.ah,[A.rq,A.vg,A.wQ])
x(A.v9,B.b6)
x(A.G4,B.B2)
x(A.a4v,B.rr)
w(B.d9,[A.aKU,A.aKV,A.aKW,A.aKX,A.aKY,A.aKZ,A.aL_,A.aL0])
x(A.qs,B.C)})()
B.dl(b.typeUniverse,JSON.parse('{"LC":{"L":[],"aZ":["L"],"G":[],"ax":[]},"rq":{"ah":["j6?"],"aw":["j6?"],"aw.T":"j6?","ah.T":"j6?"},"v9":{"b6":[],"ay":[],"e":[]},"vg":{"ah":["af"],"aw":["af"],"aw.T":"af","ah.T":"af"},"wQ":{"ah":["bb"],"aw":["bb"],"aw.T":"bb","ah.T":"bb"},"G4":{"S":[],"e":[]},"a4v":{"V":["G4"]}}'))
var y=(function rtii(){var x=B.O
return{D:x("j6"),k:x("af"),v:x("dN"),S:x("ll"),W:x("dO"),w:x("bb"),K:x("rq?"),E:x("vg?"),h:x("pz?"),Z:x("nP?"),e:x("wQ?")}})()};
(a=>{a["hxDenzdeZQVt2vhv/ysvXn+gSMs="]=a.current})($__dart_deferred_initializers__);
((a,b)=>{a[b]=a[b]||{}})(self,"$__dart_deferred_initializers__")
$__dart_deferred_initializers__.current=function(a,b,c,$){var J,A,D,B={b4W:function b4W(){},b4V:function b4V(){},pI:function pI(d,e){this.a=d
this.b=e},amL:function amL(d){this.a=d},amM:function amM(d,e){this.a=d
this.b=e},amK:function amK(d,e){this.a=d
this.b=e},amN:function amN(d,e){this.a=d
this.b=e},amJ:function amJ(d,e){this.a=d
this.b=e},amG:function amG(d){this.a=d},amH:function amH(d,e){this.a=d
this.b=e},amF:function amF(d,e){this.a=d
this.b=e},amI:function amI(d,e){this.a=d
this.b=e},amE:function amE(d,e){this.a=d
this.b=e},Ax:function Ax(d){this.a=d},b5F:function b5F(){},
ZB(d){var w=0,v=A.u(x.J),u,t,s,r
var $async$ZB=A.p(function(e,f){if(e===1)return A.q(f,v)
for(;;)switch(w){case 0:t=x.T
s=d.ac($.fD(),t)
r=d.ac($.dX(),x.D).gn()
u=B.arV(s,d.ac($.bd6(),t),r,d.ac($.zk().gEQ(),x.z))
w=1
break
case 1:return A.r(u,v)}})
return A.t($async$ZB,v)},
arV(d,e,f,g){var w=0,v=A.u(x.J),u,t,s,r,q
var $async$arV=A.p(function(h,i){if(h===1)return A.q(i,v)
for(;;)switch(w){case 0:if(e==null)if(f==null)t=null
else{s=f.h(0,"location_id")
s=s==null?null:J.a7(s)
t=s}else t=e
r=B
q=d
w=d!=null?3:5
break
case 3:w=6
return A.n(g,$async$arV)
case 6:w=4
break
case 5:i=null
case 4:u=new r.ZA(q,i,t)
w=1
break
case 1:return A.r(u,v)}})
return A.t($async$arV,v)},
ZA:function ZA(d,e,f){this.a=d
this.b=e
this.c=f}},C
J=c[1]
A=c[0]
D=c[100]
B=a.updateHolder(c[35],B)
C=c[60]
B.pI.prototype={
oJ(d){return this.aLu(d)},
aLu(d){var w=0,v=A.u(x.H),u=1,t=[],s=this,r,q,p,o
var $async$oJ=A.p(function(e,f){if(e===1){t.push(f)
w=u}for(;;)switch(w){case 0:u=3
w=6
return A.n(s.b.oJ(d),$async$oJ)
case 6:s.a.dL($.p7())
u=1
w=5
break
case 3:u=2
o=t.pop()
r=A.a1(o)
p=A.fZ("Delete failed: "+A.j(r),r)
throw A.h(p)
w=5
break
case 2:w=1
break
case 5:return A.r(null,v)
case 1:return A.q(t.at(-1),v)}})
return A.t($async$oJ,v)},
ui(d,e,f,g,h,i){return this.aPV(d,e,f,g,h,i)},
aPU(d,e,f,g,h){return this.ui(d,e,f,null,g,h)},
aPV(a1,a2,a3,a4,a5,a6){var w=0,v=A.u(x.H),u=1,t=[],s=this,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,a0
var $async$ui=A.p(function(a7,a8){if(a7===1){t.push(a8)
w=u}for(;;)switch(w){case 0:e=""+Date.now()+"_"+a6+".jpg"
d=new A.bD(Date.now(),0,!1).my()
u=3
r=A.bd(y.b,!1,!1,!1)
q=a5
j=r.b
w=!j.test(a5.toLowerCase())?6:7
break
case 6:j=$.ef().b
j===$&&A.a()
w=8
return A.n(j.cN("locations").kP("id").h2("display_id",a5).qU(),$async$ui)
case 8:p=a8
j=p
if(j==null)i=null
else{j=J.bW(j,"id")
i=j==null?null:J.a7(j)}o=i
if(o!=null&&o.length!==0)q=o
case 7:w=a3?9:11
break
case 9:a8=0
w=10
break
case 11:w=12
return A.n(s.b.Dx(q),$async$ui)
case 12:case 10:n=a8
m=A.y(x.N,x.K)
J.eG(m,"plate",a6)
j=a3?"Quick Warning":"Quick Ticket"
J.eG(m,"violation_type",j)
j=a3?0:n
J.eG(m,"fine_amount",j)
j=a3?"warning":"issued"
J.eG(m,"status",j)
J.eG(m,"issued_at",d)
J.eG(m,"evidence_r2_url",e)
J.eG(m,"location_id",q)
J.eG(m,"is_lpr_scan",a2)
if(a4!=null)J.eG(m,"issuer_role",a4)
l=m
m=s.a
j=$.UX()
h=x.I
g=m.ac(j.giP(),h)
g.ih(new B.amL(l).$1(A.lV.prototype.gmH.call(g)))
g=s.b
w=13
return A.n(A.i8(A.b([g.Dl(a1,e),g.BZ(l)],x.M),x.H).mx(C.xT),$async$ui)
case 13:m.dL($.p7())
h=m.ac(j.giP(),h)
h.ih(new B.amM(a6,e).$1(A.lV.prototype.gmH.call(h)))
u=1
w=5
break
case 3:u=2
a0=t.pop()
k=A.a1(a0)
m=s.a.ac($.UX().giP(),x.I)
m.ih(new B.amN(a6,e).$1(A.lV.prototype.gmH.call(m)))
m=A.fZ("Issue failed: "+A.j(k),k)
throw A.h(m)
w=5
break
case 2:w=1
break
case 5:return A.r(null,v)
case 1:return A.q(t.at(-1),v)}})
return A.t($async$ui,v)},
AT(d,e,f,g,h){return this.aKU(d,e,f,g,h)},
aKU(d,a0,a1,a2,a3){var w=0,v=A.u(x.H),u=1,t=[],s=this,r,q,p,o,n,m,l,k,j,i,h,g,f,e
var $async$AT=A.p(function(a4,a5){if(a4===1){t.push(a5)
w=u}for(;;)switch(w){case 0:h=""+Date.now()+"_"+a2+".jpg"
g=new A.bD(Date.now(),0,!1).my()
f=A.bd(y.b,!1,!1,!1)
w=!f.b.test(a1.toLowerCase())?2:4
break
case 2:p=$.ef().b
p===$&&A.a()
w=5
return A.n(p.cN("locations").kP("id").h2("display_id",a1).qU(),$async$AT)
case 5:o=a5
if(o==null)n=null
else{p=o.h(0,"id")
n=p==null?null:J.a7(p)}m=n!=null&&n.length!==0?n:a1
w=3
break
case 4:m=a1
case 3:r=A.a4(["plate",a2,"violation_type",a3,"fine_amount",50,"status","issued","location_id",m,"evidence_r2_url",h,"issued_at",g,"issuer_role",a0],x.N,x.K)
u=7
p=s.a
l=$.UX()
k=x.I
j=p.ac(l.giP(),k)
j.ih(new B.amG(r).$1(A.lV.prototype.gmH.call(j)))
j=s.b
w=10
return A.n(A.i8(A.b([j.Dl(d,h),j.BZ(r)],x.M),x.H).mx(C.xT),$async$AT)
case 10:p.dL($.p7())
k=p.ac(l.giP(),k)
k.ih(new B.amH(a2,h).$1(A.lV.prototype.gmH.call(k)))
u=1
w=9
break
case 7:u=6
e=t.pop()
q=A.a1(e)
p=s.a.ac($.UX().giP(),x.I)
p.ih(new B.amI(a2,h).$1(A.lV.prototype.gmH.call(p)))
p=A.fZ("Case upload failed: "+A.j(q),q)
throw A.h(p)
w=9
break
case 6:w=1
break
case 9:return A.r(null,v)
case 1:return A.q(t.at(-1),v)}})
return A.t($async$AT,v)},
pn(d){return this.aeu(d)},
aeu(d){var w=0,v=A.u(x.T),u,t=this
var $async$pn=A.p(function(e,f){if(e===1)return A.q(f,v)
for(;;)switch(w){case 0:u=t.b.pn(d)
w=1
break
case 1:return A.r(u,v)}})
return A.t($async$pn,v)}}
B.Ax.prototype={
oJ(d){return this.aLv(d)},
aLv(d){var w=0,v=A.u(x.H),u=this
var $async$oJ=A.p(function(e,f){if(e===1)return A.q(f,v)
for(;;)switch(w){case 0:w=2
return A.n(u.a.cN("violations").Ry().h2("id",d),$async$oJ)
case 2:return A.r(null,v)}})
return A.t($async$oJ,v)},
BZ(d){return this.aPk(d)},
aPk(d){var w=0,v=A.u(x.H),u=this
var $async$BZ=A.p(function(e,f){if(e===1)return A.q(f,v)
for(;;)switch(w){case 0:w=2
return A.n(u.a.cN("violations").jS(0,d),$async$BZ)
case 2:return A.r(null,v)}})
return A.t($async$BZ,v)},
Dl(d,e){return this.aUT(d,e)},
aUT(d,e){var w=0,v=A.u(x.H),u=this,t
var $async$Dl=A.p(function(f,g){if(f===1)return A.q(g,v)
for(;;)switch(w){case 0:t=u.a.at
t===$&&A.a()
w=2
return A.n(t.cN("evidence").Dk(e,d,C.a_8),$async$Dl)
case 2:return A.r(null,v)}})
return A.t($async$Dl,v)},
pn(d){return this.aev(d)},
aev(d){var w=0,v=A.u(x.T),u,t=2,s=[],r=this,q,p,o
var $async$pn=A.p(function(e,f){if(e===1){s.push(f)
w=t}for(;;)switch(w){case 0:t=4
q=r.a.at
q===$&&A.a()
w=7
return A.n(q.cN("evidence").Ho(d,3600),$async$pn)
case 7:q=f
u=q
w=1
break
t=2
w=6
break
case 4:t=3
o=s.pop()
q=r.a.at
q===$&&A.a()
q=q.cN("evidence").VG(d)
u=q
w=1
break
w=6
break
case 3:w=2
break
case 6:case 1:return A.r(u,v)
case 2:return A.q(s.at(-1),v)}})
return A.t($async$pn,v)},
Dx(d){return this.aes(d)},
aes(d){var w=0,v=A.u(x.i),u,t=this,s,r,q
var $async$Dx=A.p(function(e,f){if(e===1)return A.q(f,v)
for(;;)switch(w){case 0:w=3
return A.n(t.a.cN("locations").kP("base_price_daily").h2("id",d).abs(1),$async$Dx)
case 3:r=f
q=J.aI(r)
if(q.gbY(r)){s=J.bW(q.gae(r),"base_price_daily")
if(s!=null){if(typeof s=="number")q=s
else{q=A.h5(J.a7(s))
if(q==null)q=50}u=q
w=1
break}}u=50
w=1
break
case 1:return A.r(u,v)}})
return A.t($async$Dx,v)}}
B.ZA.prototype={}
var z=a.updateTypes(["Ax(c_)","pI(c_)"])
B.b4W.prototype={
$1(d){var w=$.ef().b
w===$&&A.a()
return new B.Ax(w)},
$S:z+0}
B.b4V.prototype={
$1(d){return new B.pI(d,d.a8($.boF(),x.W))},
$S:z+1}
B.amL.prototype={
$1(d){var w=A.b([this.a],x.t)
J.zm(w,d)
return w},
$S:27}
B.amM.prototype={
$1(d){var w=J.fF(d,new B.amK(this.a,this.b))
w=A.Y(w,w.$ti.i("B.E"))
return w},
$S:27}
B.amK.prototype={
$1(d){var w=d.h(0,"plate")
if(w==null)w=""
if(J.c(w,this.a)){w=d.h(0,"evidence_r2_url")
if(w==null)w=""
w=!J.c(w,this.b)}else w=!0
return w},
$S:8}
B.amN.prototype={
$1(d){var w=J.fF(d,new B.amJ(this.a,this.b))
w=A.Y(w,w.$ti.i("B.E"))
return w},
$S:27}
B.amJ.prototype={
$1(d){var w=d.h(0,"plate")
if(w==null)w=""
if(J.c(w,this.a)){w=d.h(0,"evidence_r2_url")
if(w==null)w=""
w=!J.c(w,this.b)}else w=!0
return w},
$S:8}
B.amG.prototype={
$1(d){var w=A.b([this.a],x.t)
J.zm(w,d)
return w},
$S:27}
B.amH.prototype={
$1(d){var w=J.fF(d,new B.amF(this.a,this.b))
w=A.Y(w,w.$ti.i("B.E"))
return w},
$S:27}
B.amF.prototype={
$1(d){var w=d.h(0,"plate")
if(w==null)w=""
if(J.c(w,this.a)){w=d.h(0,"evidence_r2_url")
if(w==null)w=""
w=!J.c(w,this.b)}else w=!0
return w},
$S:8}
B.amI.prototype={
$1(d){var w=J.fF(d,new B.amE(this.a,this.b))
w=A.Y(w,w.$ti.i("B.E"))
return w},
$S:27}
B.amE.prototype={
$1(d){var w=d.h(0,"plate")
if(w==null)w=""
if(J.c(w,this.a)){w=d.h(0,"evidence_r2_url")
if(w==null)w=""
w=!J.c(w,this.b)}else w=!0
return w},
$S:8}
B.b5F.prototype={
$1(d){return A.b([],x.t)},
$S:746};(function inheritance(){var w=a.inheritMany
w(A.d9,[B.b4W,B.b4V,B.amL,B.amM,B.amK,B.amN,B.amJ,B.amG,B.amH,B.amF,B.amI,B.amE,B.b5F])
w(A.C,[B.pI,B.Ax,B.ZA])})()
var y={b:"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"}
var x=(function rtii(){var w=A.O
return{D:w("be<Q<f,@>?>"),W:w("Ax"),z:w("a_<f?>"),M:w("o<a_<~>>"),t:w("o<Q<f,@>>"),J:w("ZA"),K:w("C"),I:w("iQ<H<Q<f,@>>>"),N:w("f"),i:w("w"),T:w("f?"),H:w("~")}})();(function constants(){C.xT=new A.aW(25e6)
C.a_8=new A.Im(!1,"image/jpeg")
C.uN=new A.a38(2,"characters")})();(function lazyInitializers(){var w=a.lazyFinal
w($,"bKH","boF",()=>A.ih(new B.b4W(),null,!1,null,null,x.W))
w($,"bKG","UW",()=>A.ih(new B.b4V(),null,!1,null,null,A.O("pI")))
w($,"bL3","UX",()=>D.pc.$1$1(new B.b5F(),A.O("H<Q<f,@>>")))})()};
(a=>{a["RiDwwfpQkb7xsI0Turc7daHxbco="]=a.current})($__dart_deferred_initializers__);
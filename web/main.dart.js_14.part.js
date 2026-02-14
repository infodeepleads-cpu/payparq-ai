((a,b)=>{a[b]=a[b]||{}})(self,"$__dart_deferred_initializers__")
$__dart_deferred_initializers__.current=function(a,b,c,$){var J,A,C,B={
bzs(d){var w,v=C.bD.ty(d,null)
if(!x.j.b(v))return A.b([],x.t)
w=J.b7k(v,x.f)
w=A.jg(w,new B.b32(),w.$ti.i("B.E"),x.P)
w=A.Y(w,A.k(w).i("B.E"))
return w},
j1(d,e){var $async$j1=A.p(function(f,g){switch(f){case 2:r=u
w=r.pop()
break
case 1:s.push(g)
w=t}for(;;)switch(w){case 0:w=3
return A.hb(A.a27(),$async$j1,v)
case 3:q=g
p=A.ck(q.a.h(0,d))
w=p!=null?4:5
break
case 4:w=6
u=[1]
return A.hb(A.r3(B.bzs(p)),$async$j1,v)
case 6:case 5:w=7
u=[1]
return A.hb(A.baB(new A.eE(new B.b2M(q,d),e,A.k(e).i("eE<b7.T,H<Q<f,@>>>"))),$async$j1,v)
case 7:case 1:return A.hb(null,0,v)
case 2:return A.hb(s.at(-1),1,v)}})
var w=0,v=A.bbd($async$j1,x.p),u,t=2,s=[],r=[],q,p
return A.bbg(v)},
b32:function b32(){},
b2M:function b2M(d,e){this.a=d
this.b=e},
kK:function kK(d){this.a=d},
b5G:function b5G(){},
b64:function b64(){},
UB:function UB(){},
IN:function IN(d,e,f,g,h,i,j,k,l){var _=this
_.go=d
_.f=e
_.r=f
_.a=g
_.b=h
_.c=i
_.d=j
_.e=k
_.$ti=l},
FR:function FR(d,e,f,g,h,i,j,k,l){var _=this
_.dy=d
_.qw$=e
_.nj$=f
_.qx$=g
_.nk$=h
_.c=i
_.e=null
_.f=0
_.r=!1
_.y=_.x=_.w=null
_.z=j
_.at=_.as=_.Q=!1
_.ax=0
_.ay=null
_.cy=_.CW=!1
_.db=k
_.dx=!1
_.$ti=l},
ag8:function ag8(d,e){this.a=d
this.b=e},
Oo:function Oo(){},
PX:function PX(){},
PY:function PY(){},
PZ:function PZ(){}}
J=c[1]
A=c[0]
C=c[2]
B=a.updateHolder(c[51],B)
B.kK.prototype={
VF(d){var w,v="parking_permits",u="created_at"
A.bm().$1("getPermitsStream locationId="+A.j(d))
if(d!=null){w=this.a.cN(v).js(A.b(["id"],x.s))
w.z=new A.oS("location_id",d,C.eU)
w.Q=new A.ka(u,!1)
return w}A.bm().$1("getPermitsStream global stream")
w=this.a.cN(v).js(A.b(["id"],x.s))
w.Q=new A.ka(u,!1)
return w},
VE(){return this.VF(null)},
VI(d){var w,v="parking_sessions",u="created_at"
A.bm().$1("getSessionsStream locationId="+A.j(d))
if(d!=null){w=this.a.cN(v).js(A.b(["id"],x.s))
w.z=new A.oS("location_id",d,C.eU)
w.Q=new A.ka(u,!1)
return w}A.bm().$1("getSessionsStream global stream")
w=this.a.cN(v).js(A.b(["id"],x.s))
w.Q=new A.ka(u,!1)
return w},
VH(){return this.VI(null)},
L_(d,e){var w,v,u,t="locations",s="updated_at"
A.bm().$1("getLocationsStream locationId="+A.j(d)+" ownerId="+A.j(e))
if(e!=null){w=this.a.cN(t).js(A.b(["id"],x.s))
w.z=new A.oS("owner_id",e,C.eU)
w.Q=new A.ka(s,!1)
return w}else if(d!=null){w=A.bd(y.b,!0,!1,!1)
v=d.toLowerCase()
u=w.b.test(v)
w=this.a.cN(t).js(A.b(["id"],x.s))
w.z=new A.oS(u?"id":"display_id",d,C.eU)
w.Q=new A.ka(s,!1)
return w}A.bm().$1("getLocationsStream global stream")
w=this.a.cN(t).js(A.b(["id"],x.s))
w.Q=new A.ka(s,!1)
return w},
aeF(){return this.L_(null,null)},
aeH(d){return this.L_(null,d)},
aeG(d){return this.L_(d,null)},
VP(d){var w,v,u="violations",t="issued_at"
A.bm().$1("getViolationsStream locationId="+A.j(d))
if(d!=null){w=A.bd(y.b,!0,!1,!1)
v=d.toLowerCase()
if(w.b.test(v)){w=this.a.cN(u).js(A.b(["id"],x.s))
w.z=new A.oS("location_id",d,C.eU)
w.Q=new A.ka(t,!1)
return w}}A.bm().$1("getViolationsStream global stream")
w=this.a.cN(u).js(A.b(["id"],x.s))
w.Q=new A.ka(t,!1)
return w},
VO(){return this.VP(null)},
VL(d){var w,v="profiles",u="created_at"
if(d!=null){w=this.a.cN(v).js(A.b(["id"],x.s))
w.z=new A.oS("location_id",d,C.eU)
w.Q=new A.ka(u,!1)
return w}w=this.a.cN(v).js(A.b(["id"],x.s))
w.Q=new A.ka(u,!1)
return w},
L4(){return this.VL(null)},
Hz(d){return this.aLr(d)},
aLr(d){var w=0,v=A.u(x.H),u=this
var $async$Hz=A.p(function(e,f){if(e===1)return A.q(f,v)
for(;;)switch(w){case 0:w=2
return A.n(u.a.cN("parking_permits").Ry().h2("id",d),$async$Hz)
case 2:return A.r(null,v)}})
return A.t($async$Hz,v)},
Hx(d){return this.aLq(d)},
aLq(d){var w=0,v=A.u(x.H),u=this
var $async$Hx=A.p(function(e,f){if(e===1)return A.q(f,v)
for(;;)switch(w){case 0:w=2
return A.n(u.a.cN("locations").Ry().h2("id",d),$async$Hx)
case 2:return A.r(null,v)}})
return A.t($async$Hx,v)}}
B.UB.prototype={}
B.IN.prototype={
lb(d){return this.go.$1(d)},
v_(d){var w=null,v=this.$ti
return new B.FR(v.i("jx<be<1>,1,1/>").a(d.a),new A.fX(A.b9(0,w,!1,v.i("iY<a_<1>>?")),v.i("fX<a_<1>>")),w,w,w,d,A.b([],x.V),A.Gp(v.c),v.i("FR<1>"))}}
B.FR.prototype={
lb(d){return this.aNM(d,new B.ag8(this,d))}}
B.Oo.prototype={}
B.PX.prototype={}
B.PY.prototype={}
B.PZ.prototype={
gt(d){var w=A.C.prototype.gt.call(this,0)
return w}}
var z=a.updateTypes(["kK(c_)"])
B.b32.prototype={
$1(d){return A.iM(d,x.N,x.z)},
$S:285}
B.b2M.prototype={
$1(d){this.a.a4B("String",this.b,C.bD.Bl(d,null))
return d},
$S:27}
B.b5G.prototype={
$1(d){var w=$.ef().b
w===$&&A.a()
return new B.kK(w)},
$S:z+0}
B.b64.prototype={
$1(d){return this.ae9(d)},
ae9(d){var w=0,v=A.u(x.T),u,t=2,s=[],r,q,p,o,n
var $async$$1=A.p(function(e,f){if(e===1){s.push(f)
w=t}for(;;)switch(w){case 0:o=d.a8($.fD(),x.T)
if(o==null){u=null
w=1
break}t=4
q=$.ef().b
q===$&&A.a()
w=7
return A.n(q.cN("locations").kP("id").h2("display_id",o).qU(),$async$$1)
case 7:r=f
q=r
q=A.ck(q==null?null:J.bW(q,"id"))
u=q
w=1
break
t=2
w=6
break
case 4:t=3
n=s.pop()
u=null
w=1
break
w=6
break
case 3:w=2
break
case 6:case 1:return A.r(u,v)
case 2:return A.q(s.at(-1),v)}})
return A.t($async$$1,v)},
$S:752}
B.ag8.prototype={
$0(){return this.a.dy.lb(this.b)},
$S(){return this.a.$ti.i("1/()")}};(function inheritance(){var w=a.mixin,v=a.mixinHard,u=a.inheritMany,t=a.inherit
u(A.d9,[B.b32,B.b2M,B.b5G,B.b64])
u(A.C,[B.kK,B.UB])
t(B.PX,A.jx)
t(B.PY,B.PX)
t(B.PZ,B.PY)
t(B.IN,B.PZ)
t(B.Oo,A.jy)
t(B.FR,B.Oo)
t(B.ag8,A.e9)
w(B.Oo,A.wg)
w(B.PX,A.zd)
w(B.PY,B.UB)
v(B.PZ,A.o5)})()
A.dl(b.typeUniverse,JSON.parse('{"IN":{"jx":["be<1>","1","1/"],"zd":["1"],"o5":["be<1>"],"ek":["be<1>"],"jU":["be<1>"],"ii":[],"ok":["be<1>"],"of":[],"ek.0":"be<1>"},"FR":{"jy":["be<1>","1","1/"],"iW":["be<1>","1","1/"],"wg":["1"],"dn":["be<1>","1"],"cn":["be<1>","1"],"cn.0":"be<1>","cn.1":"1","dn.1":"1","iW.1":"1"}}'))
A.yX(b.typeUniverse,JSON.parse('{"UB":1,"Oo":1,"PX":1,"PY":1,"PZ":1}'))
var y={b:"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"}
var x=(function rtii(){var w=A.O
return{t:w("o<Q<f,@>>"),V:w("o<jV<C?>>"),s:w("o<f>"),p:w("H<Q<f,@>>"),j:w("H<@>"),P:w("Q<f,@>"),f:w("Q<@,@>"),N:w("f"),z:w("@"),T:w("f?"),H:w("~")}})();(function lazyInitializers(){var w=a.lazyFinal
w($,"bL4","zj",()=>A.ih(new B.b5G(),null,!1,null,null,A.O("kK")))
w($,"bLi","zk",()=>{var v=null
return new B.IN(new B.b64(),v,v,v,v,v,A.b4v(v),!1,A.O("IN<f?>"))})})()};
(a=>{a["h7vqlfYdr9Hv6gYXl1uSq1p6HNo="]=a.current})($__dart_deferred_initializers__);
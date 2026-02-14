((a,b)=>{a[b]=a[b]||{}})(self,"$__dart_deferred_initializers__")
$__dart_deferred_initializers__.current=function(a,b,c,$){var J,A,B={b6b:function b6b(){},b69:function b69(){},b6a:function b6a(d){this.a=d},b68:function b68(d){this.a=d}},C
J=c[1]
A=c[0]
B=a.updateHolder(c[36],B)
C=c[51]
var z=a.updateTypes([])
B.b6b.prototype={
$1(d){var x,w,v,u,t,s,r,q,p,o,n="sessionsStreamProvider role=",m=d.a8($.zj(),y.B),l=d.a8($.dX(),y.e).gn(),k=$.ef().b
k===$&&A.a()
k=k.gm4().c
x=k==null?null:k.r
if(x==null)return A.k1(A.b([],y.k),y.E)
k=l==null?null:l.h(0,"role")
if(k==null){k=x.c
k=k==null?null:k.h(0,"role")
w=k}else w=k
if(w==null)w="admin"
k=J.hG(w)
v=k.k(w,"super_admin")
u=k.k(w,"admin")
t=k.k(w,"manager")
s=k.k(w,"officer")
if(v){A.bm().$1(n+A.j(w)+" user="+x.a+" path=global")
return C.j1("sessions_all",m.VH())}if(u||t||s){r=d.a8($.l6(),y.n)
if(r.gfm()==null)return A.k1(A.b([],y.k),y.E)
q=r.gn()
if(q==null)q=A.b([],y.k)
p=J.dY(q,new B.b69(),y.w).h9(0)
k=x.a
A.bm().$1(n+A.j(w)+" user="+k+" ids="+p.j(0)+" path=filtered")
k=C.j1("sessions_scope_"+k,m.VH())
return new A.eE(new B.b6a(p),k,k.$ti.i("eE<b7.T,H<Q<f,@>>>"))}o=d.a8($.zk(),y.x)
if(o.gfm()==null||o.gn()==null)return A.k1(A.b([],y.k),y.E)
k=o.gn()
k.toString
return C.j1("sessions_"+k,m.VI(k))},
$S:70}
B.b69.prototype={
$1(d){var x=d.h(0,"id")
return J.a7(x==null?"":x)},
$S:77}
B.b6a.prototype={
$1(d){var x=J.fF(d,new B.b68(this.a))
x=A.Y(x,x.$ti.i("B.E"))
return x},
$S:27}
B.b68.prototype={
$1(d){var x=d.h(0,"location_id")
return this.a.p(0,J.a7(x==null?"":x))},
$S:8};(function inheritance(){var x=a.inheritMany
x(A.d9,[B.b6b,B.b69,B.b6a,B.b68])})()
var y={n:A.O("be<H<Q<f,@>>>"),e:A.O("be<Q<f,@>?>"),x:A.O("be<f?>"),k:A.O("o<Q<f,@>>"),E:A.O("H<Q<f,@>>"),B:A.O("kK"),w:A.O("f")};(function lazyInitializers(){var x=a.lazyFinal
x($,"bLj","UY",()=>A.u9(new B.b6b(),y.E))})()};
(a=>{a["AMhBBtYxjkJnZz5//2GjNP1p+gE="]=a.current})($__dart_deferred_initializers__);
((a,b)=>{a[b]=a[b]||{}})(self,"$__dart_deferred_initializers__")
$__dart_deferred_initializers__.current=function(a,b,c,$){var J,A,C,B={b5P:function b5P(){},b5N:function b5N(){},b5O:function b5O(d){this.a=d},b5M:function b5M(d){this.a=d}}
J=c[1]
A=c[0]
C=c[51]
B=a.updateHolder(c[44],B)
var z=a.updateTypes([])
B.b5P.prototype={
$1(d){var x,w,v,u,t,s,r,q,p,o,n="permitsStreamProvider role=",m=d.a8($.zj(),y.B),l=d.a8($.dX(),y.e).gn(),k=$.ef().b
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
return C.j1("permits_all",m.VE())}if(u||t||s){r=d.a8($.l6(),y.n)
if(r.gfm()==null)return A.k1(A.b([],y.k),y.E)
q=r.gn()
if(q==null)q=A.b([],y.k)
p=J.dY(q,new B.b5N(),y.w).h9(0)
k=x.a
A.bm().$1(n+A.j(w)+" user="+k+" ids="+p.j(0)+" path=filtered")
k=C.j1("permits_scope_"+k,m.VE())
return new A.eE(new B.b5O(p),k,k.$ti.i("eE<b7.T,H<Q<f,@>>>"))}o=d.a8($.zk(),y.x)
if(o.gfm()==null||o.gn()==null)return A.k1(A.b([],y.k),y.E)
k=o.gn()
k.toString
return C.j1("permits_"+k,m.VF(k))},
$S:70}
B.b5N.prototype={
$1(d){var x=d.h(0,"id")
return J.a7(x==null?"":x)},
$S:77}
B.b5O.prototype={
$1(d){var x=J.fF(d,new B.b5M(this.a))
x=A.Y(x,x.$ti.i("B.E"))
return x},
$S:27}
B.b5M.prototype={
$1(d){var x=d.h(0,"location_id")
return this.a.p(0,J.a7(x==null?"":x))},
$S:8};(function inheritance(){var x=a.inheritMany
x(A.d9,[B.b5P,B.b5N,B.b5O,B.b5M])})()
var y={n:A.O("be<H<Q<f,@>>>"),e:A.O("be<Q<f,@>?>"),x:A.O("be<f?>"),k:A.O("o<Q<f,@>>"),E:A.O("H<Q<f,@>>"),B:A.O("kK"),w:A.O("f")};(function lazyInitializers(){var x=a.lazyFinal
x($,"bL8","v2",()=>A.u9(new B.b5P(),y.E))})()};
(a=>{a["5fq0PQXWR1hZpnPuQ0hn8C4gV4w="]=a.current})($__dart_deferred_initializers__);
((a,b)=>{a[b]=a[b]||{}})(self,"$__dart_deferred_initializers__")
$__dart_deferred_initializers__.current=function(a,b,c,$){var J,B,C,A={b6V:function b6V(){},b6S:function b6S(){},b6T:function b6T(d){this.a=d},b6R:function b6R(d){this.a=d},b6U:function b6U(d,e,f){this.a=d
this.b=e
this.c=f},b6Q:function b6Q(d,e,f){this.a=d
this.b=e
this.c=f},b6C:function b6C(){}}
J=c[1]
B=c[0]
C=c[51]
A=a.updateHolder(c[42],A)
var z=a.updateTypes([])
A.b6V.prototype={
$1(d){var x,w,v,u,t,s,r,q,p,o,n,m,l,k,j=null,i="violationsStreamProvider role=",h=d.a8($.zj(),y.B),g=$.ef().b
g===$&&B.a()
g=g.gm4().c
x=g==null?j:g.r
w=d.a8($.dX(),y.e).gn()
if(x==null)return B.k1(B.b([],y.k),y.E)
v=d.a8($.zk(),y.x).gn()
g=y.w
u=d.a8($.fD(),g)
t=d.a8($.bd6(),g)
if(t==null){g=x.c
t=g==null?j:g.h(0,"location_id")}g=w==null?j:w.h(0,"role")
if(g==null){g=x.c
g=g==null?j:g.h(0,"role")
s=g}else s=g
if(s==null)s="admin"
g=J.hG(s)
r=g.k(s,"super_admin")
q=g.k(s,"admin")
p=g.k(s,"manager")
o=g.k(s,"officer")
if(r){B.bm().$1(i+B.j(s)+" user="+x.a+" path=global")
return C.j1("violations_all",h.VO())}if(q||p||o){n=d.a8($.l6(),y.n)
if(n.gfm()==null)return B.k1(B.b([],y.k),y.E)
m=n.gn()
if(m==null)m=B.b([],y.k)
l=J.dY(m,new A.b6S(),y.v).h9(0)
g=x.a
B.bm().$1(i+B.j(s)+" user="+g+" ids="+l.j(0)+" path=filtered")
g=C.j1("violations_scope_"+g,h.VO())
return new B.eE(new A.b6T(l),g,g.$ti.i("eE<b7.T,H<Q<f,@>>>"))}k=v==null?u:v
if(k==null)k=t
g=C.j1("violations_"+B.j(k==null?"all":k),h.VP(k))
return new B.eE(new A.b6U(v,u,t),g,g.$ti.i("eE<b7.T,H<Q<f,@>>>"))},
$S:70}
A.b6S.prototype={
$1(d){var x=d.h(0,"id")
return J.a7(x==null?"":x)},
$S:77}
A.b6T.prototype={
$1(d){var x=J.fF(d,new A.b6R(this.a))
x=B.Y(x,x.$ti.i("B.E"))
return x},
$S:27}
A.b6R.prototype={
$1(d){var x=d.h(0,"location_id")
return this.a.p(0,J.a7(x==null?"":x))},
$S:8}
A.b6U.prototype={
$1(d){var x=J.fF(d,new A.b6Q(this.a,this.b,this.c))
x=B.Y(x,x.$ti.i("B.E"))
return x},
$S:27}
A.b6Q.prototype={
$1(d){var x=d.h(0,"location_id"),w=x==null?null:J.a7(x)
x=!0
if(w!=this.a)if(w!=this.b){x=this.c
x=w==null?x==null:w===x}return x},
$S:8}
A.b6C.prototype={
$1(d){var x=d.a8($.dX(),y.e).gn()
return x==null?null:x.h(0,"location_id")},
$S:753};(function inheritance(){var x=a.inheritMany
x(B.d9,[A.b6V,A.b6S,A.b6T,A.b6R,A.b6U,A.b6Q,A.b6C])})()
var y={n:B.O("be<H<Q<f,@>>>"),e:B.O("be<Q<f,@>?>"),x:B.O("be<f?>"),k:B.O("o<Q<f,@>>"),E:B.O("H<Q<f,@>>"),B:B.O("kK"),v:B.O("f"),w:B.O("f?")};(function lazyInitializers(){var x=a.lazyFinal
x($,"bLw","p7",()=>B.u9(new A.b6V(),y.E))
x($,"bLs","bd6",()=>B.ih(new A.b6C(),null,!1,null,null,y.w))})()};
(a=>{a["SjrmgDOfFHvPew4FJBN/S1xmq00="]=a.current})($__dart_deferred_initializers__);
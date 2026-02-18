let lastSubscription: any = null;

export function setSubscription(sub: any) {
  lastSubscription = sub;
}

export function getSubscription() {
  return lastSubscription;
}

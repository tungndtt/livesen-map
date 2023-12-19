export default function deepCompare(obj1: any, obj2: any) {
  if(typeof obj1 !== typeof obj2) return false;
  switch(typeof obj1) {
    case "object": {
      if(Object.entries(obj1).length !== Object.entries(obj2).length) return false;
      return Object.entries(obj1).every(([key, value]) => {
        const compare = deepCompare(value, obj2?.[key]) as boolean;
        return compare;
      });
    }
    default: return obj1 === obj2;
  }
}
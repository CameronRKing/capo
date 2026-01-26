import collections from "@/1-models/collections";
import { generateComponents } from "./domain-specific/generateComponents";

export type AllCmps = {
  [K in keyof typeof collections]: ReturnType<typeof generateComponents<typeof collections[K]>>;
};

export const Cmps = Object.entries(collections).reduce((acc, [modelName, schema]) => {
  const cmps = generateComponents<typeof schema>(schema);
  // @ts-ignore
  acc[modelName] = cmps;
  return acc;
}, {}) as AllCmps;

export { ModelContextProvider } from './contexts/ModelContext';
import ModelTable from './ModelTable';
export { ModelTable };
export { Flx } from './design-system/Flx';
import { 
    RxDocument, 
    RxDatabase, 
    RxCollection,
    ExtractDocumentTypeFromTypedRxJsonSchema,
    toTypedRxJsonSchema
} from 'rxdb';
import collections from '../collections'

export type Collections = keyof typeof typedCollections;
export const typedCollections = Object.assign({}, collections);
// @ts-ignore
Object.entries(typedCollections).forEach(([key, val]) => { typedCollections[key] = toTypedRxJsonSchema(val); });

export type Properties<T extends Collections> = Array<keyof Types[T]['Props']> & { 
  [p in keyof Types[T]['Props']]: Types[T]['Props'][p]
}

function makeProps<T extends Collections>(name: T): Properties<T> {
  // @ts-ignore
  return Object.entries(typedCollections[name].properties).reduce((acc, [name, schema]) => {
    // @ts-ignore
    acc.push(name);
    // @ts-ignore
    Object.assign(acc, { name: schema });
    return acc;
  }, []);

}

export const Props = Object.keys(typedCollections)
  .reduce((acc, name) =>
    // @ts-ignore
    ({...acc, [name]: makeProps(name)})
  , {}) as { [k in Collections]: Properties<k>};

export type Types = {
  [K in keyof typeof typedCollections]: {
    Props: typeof typedCollections[K]['properties']
    JSON: typeof typedCollections[K]
    Schema: ExtractDocumentTypeFromTypedRxJsonSchema<typeof typedCollections[K]>
    Coll: RxCollection<ExtractDocumentTypeFromTypedRxJsonSchema<typeof typedCollections[K]>>
    Doc: RxDocument<ExtractDocumentTypeFromTypedRxJsonSchema<typeof typedCollections[K]>>
  }
}

export type NutopiaDatabase = RxDatabase<{
  [k in Collections]: Types[k]['Coll']
}>;



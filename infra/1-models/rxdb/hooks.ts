import { MangoQuerySelector } from 'rxdb';
import { Types, NutopiaDatabase, Collections } from './types';
import { QueryConstructor, RxQueryResult, useRxDB, useRxData } from 'rxdb-hooks';

export const useDB = (): NutopiaDatabase => useRxDB();
    
// Though I understand why RxDB does not provide native support for things like:
    // relational document loading,
    // document sorting,
    // document property aggregation
// It also makes sense to me to provide conveniences for these as & when I need them.


// const [allReps, { isFetching }] = useColl('active_reps', { company: 'company1', quarter: { $gte: 0 } });
export function useColl<K extends Collections>(
    collection: K,
    query: QueryConstructor<Types[K]['Schema']> |
            MangoQuerySelector<Types[K]['Schema']>
): [ 
    coll: Array<Types[K]['Doc']>,
    Omit<RxQueryResult<Types[K]['Doc']>, 'result'>
 ] {
    if (typeof query === 'object') {
        const selector = query;
        query = coll => coll.find({ selector });
    }
  const { result: coll, ...obj } = useRxData<Types[K]['Schema']>(collection, query);
  return [ coll, obj ];
}

// const [maybeDocIfFound, { isFetching }] = useDoc('finances', id);
export function useDoc<K extends Collections>(
    collection: K,
    query: QueryConstructor<Types[K]['Schema']> |
            MangoQuerySelector<Types[K]['Schema']> | string
): [
    doc: Types[K]['Doc'] | undefined,
    Omit<RxQueryResult<Types[K]['Doc']>, 'result'>
 ] {
    if (typeof query === 'string') {
        const id = query;
        // @ts-ignore
        query = coll => coll.findOne({ selector: { id: { $eq: id } } });
    }
  const [[doc], obj] = useColl(collection, query);
  return [ doc, obj ];
}
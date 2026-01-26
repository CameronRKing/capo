import { Collections, Types, Props, Properties } from '@/domain';

export default function ModelTable<T extends Collections>(models: Array<Types[T]['Doc']>) {
    // create column for each property
    const props: Properties<T> = Props[models[0].collection.name as T];

    // for now, just data-dump raw

    return (
    <table>
        <thead>
            <tr>
            {props.map((propName) => (
                <th key={propName as string}>{ propName as string }</th> /* apparently propNames can be numbers or symbols too? */
            ))}
            </tr>
        </thead>
        <tbody>
        {models.map(model => (
            <tr key={model.id}>
            {props.map((propName) => (
                // @ts-ignore
                <td key={model.id + propName as string}>{ model[propName] }</td>  /* It's not picking up the duck-typing correctly */
            ))}
            </tr>
        ))}
        </tbody>
    </table>
    )
}
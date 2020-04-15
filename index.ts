
import PaperDB from '@paper-db/paper-db'
import { TypedObj } from '@paper-db/paper-db/dist/types/converter'
import { ACConstUser, ACConstDocType } from '@paper-db/paper-db/dist/access-controller'

interface Type1Obj extends TypedObj<'type1', 1> {
  abc: number;
}

// create a custom type converter
class Type1 {
  static readonly $type = 'type1'
  static readonly $v = 1

  constructor (private abc: number) { }

  static fromTypedObj (obj: Type1Obj, paperdb: PaperDB): Type1 | Promise<Type1> {
    void paperdb

    // validate
    if (
      obj.$type !== 'type1' ||
      obj.$v !== 1 ||
      typeof obj.abc !== 'number'
    ) {
      throw new Error()
    }

    return new Type1(obj.abc)
  }

  toTypedObj (): Promise<Type1Obj> | Type1Obj {
    return {
      $type: 'type1',
      $v: 1,
      abc: this.abc,
    }
  }
}

// add into the TypeRegistration interface
declare module '@paper-db/paper-db' {
  interface TypeRegistration {
    'type1': typeof Type1;
  }
}

PaperDB.create({ directory: 'test_db' }).then(async (paperdb) => {
  console.log(paperdb)

  // add the converter into the TYPE_REGISTRY
  paperdb.TYPE_REGISTRY.add(Type1)

  // TypeScript typings will work properly
  paperdb.TYPE_REGISTRY.get('type1')

  // create a new collection
  const c = await paperdb.collection.create<typeof Type1>({
    doctype: 'type1',
    accessControllers: [ACConstDocType, ACConstUser],
    metainfo: { id0: 'test' },
    preloadDoc: new Type1(10086),
  })

  console.log(c.id)

  const { preloadDocRef, metainfo } = await c.instantLoad()
  console.log(metainfo) // { id0: 'test' }
  console.log(await preloadDocRef?.data()) // new Type1(10086)

  // add a document into the collection
  const doc1 = await c.add(new Type1(123))

  console.log(await (await c.doc('__preload__')).data()) // new Type1(10086)
  console.log(await (await c.doc(doc1.id)).data()) // new Type1(123)

  console.log((await c.getAll()).length) // 2, including the preload document
})

import { dir } from '@/dir'
import { Database, DatabaseType } from '@/module/database'
import { UserInfoType } from '@/types'

export const UserInfoDB = async () => {
  const DB = Database.get<UserInfoType, DatabaseType.Db>()

  return await DB.init(
    dir.DataDir,
    'yysls_user_info',
    {
      userId: Database.PkColumn('STRING'),
      mainUid: Database.Column<string>('STRING', ''),
      uidList: Database.ArrayColumn<string>('uidList')
    },
    DatabaseType.Db
  )
}

import { dir } from '@/dir'
import { Database, DatabaseType } from '@/module/database'
import { AccountInfoType } from '@/types'

export const AccountInfoDB = async () => {
  const DB = Database.get<AccountInfoType, DatabaseType.Db>()

  return await DB.init(
    dir.DataDir,
    'yysls_account_info',
    {
      uid: Database.PkColumn('STRING'),
      name: Database.Column<string>('STRING', ''),
      level: Database.Column<number>('INTEGER', 0),
      club: Database.Column<string>('STRING', ''),
      avatar: Database.Column<string>('STRING', ''),
      accessToken: Database.Column<string>('STRING', '')
    },
    DatabaseType.Db
  )
}

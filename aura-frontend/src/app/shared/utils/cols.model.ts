export class ColsModel {
  field: string
  header: string
  nameClass?: string
  type?: string
  visible?: boolean
  width?: string
  minWidth?: string

  constructor(
    field: string,
    header: string,
    nameClass?: string,
    type?: string,
    visible: boolean = true
  ) {
    this.field = field
    this.header = header
    this.nameClass = nameClass
    this.type = type
    this.visible = visible
  }
}

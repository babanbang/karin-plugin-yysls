export interface EquipItem {
  id: number
  name: string
  quality: number
  image: string
  long_icon: string
}

export interface EquipImageType {
  id: number
  name: string
  icon_url: string
  long_icon_url: string
  star: number
}

export interface EquipTiaolvType {
  id: number
  affix_des: string
  value_show_form?: string
  show_plus?: number
}

export interface EquipPropType {
  id: number
  prop_name_cn: string
  prop_name_en: string
  show_class_attrs_form?: string
}

export interface EquipSuitType {
  id: number
  name: string
  short: string
}

export interface EquipTiaolvItem extends EquipTiaolvType {
  data: {
    type: string
    label: string
    value: string
    percent: number
    recommend: boolean
  }
}

export interface EquipPropItem extends EquipPropType {
  data: {
    label: string
    value: string
  }
}

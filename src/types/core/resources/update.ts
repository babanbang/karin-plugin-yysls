export interface ImageMapType {
  id: string
  name?: string

  bg?: string
  icon?: string
  image?: string
}

export interface BaseImageType {
  id: number
  pic_url: string
}

export interface QishuImageType extends BaseImageType {
  name: string
}

export interface MenpaiImageType {
  id: number
  name: string
  menpai_pic_url: string
  menpai_name_pic_url: string
}

export interface CardbgImageType extends BaseImageType {
  name: string
}

export interface WuxueImageType extends BaseImageType {
  name: string
  liupai_pic_url: string
}

export interface XinfaImageType {
  id: number
  name: string
  icon_url: string
  bg_icon_url: string
  liupai_pic_url: string
  liupai_pic_big_url: string
}

export interface FashionLevelImageType {
  id: number
  name: string
  icon_url: string
}

export interface ImageMapType {
  id: string
  image: string
  icon: string
}

export interface BaseImage {
  id: number
  pic_url: string
}

export interface QishuImage extends BaseImage {
  name: string
}

export interface EquipImage {
  id: number
  name: string
  icon_url: string
  long_icon_url: string
}

export interface MenpaiImage {
  id: number
  name: string
  menpai_pic_url: string
  menpai_name_pic_url: string
}

export interface CardbgImage extends BaseImage {
  name: string
}

export interface WuxueImage extends BaseImage {
  name: string
  liupai_pic_url: string
}

export interface FashionLevelImage {
  id: number
  name: string
  icon_url: string
}

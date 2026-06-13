export async function uploadToCloudinary(file) {
  // 10MB 大小检查（Cloudinary 免费版单张限制）
  if (file.size > 10 * 1024 * 1024) {
    throw new Error(`"${file.name}" 超过 10MB，请压缩后再上传`)
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)

  const res  = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  const data = await res.json()

  if (!res.ok) throw new Error(data.error?.message || 'Upload failed')

  return { url: data.secure_url, cloudinary_id: data.public_id }
}
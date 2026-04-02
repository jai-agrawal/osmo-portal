function getFileExtension(file) {
  return file.name.split('.').pop() || '';
}

const getSignedUrls = async (payload) => {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_SIGNED_FILE_URLS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return response.json();
    } else {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      return null;
    }
  } catch (error) {
    console.error('Error creating signed urls:', error);
    return null;
  }
}

const uploadFileToS3Bucket = async (signedUrl, file) => {
  return fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });
}

const uploadFiles = async (files) => {
  const originalFiles = Object.values(files);
  const payload = originalFiles.map((file) => ({
    name: file.name,
    type: file.type,
    extension: getFileExtension(file),
    size: file.size
  }));

  const signedUrls = await getSignedUrls(payload);
  for (const signedUrl of signedUrls) {
    const file = originalFiles.find((file) => file.name === signedUrl.name);
    await uploadFileToS3Bucket(signedUrl.signedUrl, file);
  }
  return signedUrls;
}

export {
  getSignedUrls,
  uploadFiles,
  getFileExtension
}

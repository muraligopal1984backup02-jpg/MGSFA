import { useState, useEffect } from 'react';
import { Camera, Loader, Trash2, Upload, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  uploadCustomerImage,
  deleteCustomerImage,
  validateImageFile,
} from '../../lib/mediaUtils';

interface Props {
  customerId: string;
}

interface ImageRecord {
  id: string;
  image_url: string;
  image_order: number;
  captured_at: string;
}

export default function CustomerImageUpload({ customerId }: Props) {
  const { user } = useAuth();
  const [images, setImages] = useState<(ImageRecord | null)[]>([null, null, null]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    fetchImages();
  }, [customerId]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_media_tbl')
        .select('id, image_url, image_order, captured_at')
        .eq('customer_id', customerId)
        .eq('media_type', 'image')
        .order('image_order');

      if (error) throw error;

      const imageArray: (ImageRecord | null)[] = [null, null, null];
      data?.forEach((img) => {
        if (img.image_order >= 1 && img.image_order <= 3) {
          imageArray[img.image_order - 1] = img as ImageRecord;
        }
      });
      setImages(imageArray);
    } catch (err) {
      console.error('Error fetching images:', err);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, slot: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setUploading(slot);
    setError('');
    setSuccess('');

    try {
      const existingImage = images[slot - 1];
      if (existingImage) {
        const oldPath = existingImage.image_url.split('/').slice(-2).join('/');
        await deleteCustomerImage(oldPath);
        await supabase.from('customer_media_tbl').delete().eq('id', existingImage.id);
      }

      const uploadResult = await uploadCustomerImage(customerId, file, slot);

      const { error: insertError } = await supabase.from('customer_media_tbl').insert({
        customer_id: customerId,
        media_type: 'image',
        image_url: uploadResult.url,
        image_order: slot,
        uploaded_by: user?.id,
      });

      if (insertError) throw insertError;

      await fetchImages();
      setSuccess(`Image ${slot} uploaded successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setTimeout(() => setError(''), 5000);
    } finally {
      setUploading(null);
      event.target.value = '';
    }
  };

  const handleDeleteImage = async (slot: number) => {
    const imageToDelete = images[slot - 1];
    if (!imageToDelete) return;

    if (!confirm('Are you sure you want to delete this image?')) return;

    setDeleting(slot);
    setError('');
    setSuccess('');

    try {
      const imagePath = imageToDelete.image_url.split('/').slice(-2).join('/');
      await deleteCustomerImage(imagePath);

      const { error } = await supabase
        .from('customer_media_tbl')
        .delete()
        .eq('id', imageToDelete.id);

      if (error) throw error;

      await fetchImages();
      setSuccess(`Image ${slot} deleted successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
      setTimeout(() => setError(''), 5000);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Customer Images</h3>
        <p className="text-sm text-gray-600">Upload up to 3 images</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Check size={20} className="text-green-600" />
          <p className="text-green-900 font-medium">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((slot) => {
          const image = images[slot - 1];
          const isUploading = uploading === slot;
          const isDeleting = deleting === slot;

          return (
            <div
              key={slot}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              <div className="aspect-square relative bg-gray-100">
                {image ? (
                  <>
                    <img
                      src={image.image_url}
                      alt={`Customer image ${slot}`}
                      className="w-full h-full object-cover"
                    />
                    {isDeleting && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Loader size={32} className="text-white animate-spin" />
                      </div>
                    )}
                  </>
                ) : isUploading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <Loader size={32} className="text-blue-600 animate-spin mb-2" />
                    <p className="text-sm text-gray-600">Uploading...</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Camera size={48} className="mb-2" />
                    <p className="text-sm">No image</p>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Image {slot}</p>
                  {image && (
                    <p className="text-xs text-gray-500">{formatDate(image.captured_at)}</p>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  {image ? (
                    <>
                      <label
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-sm"
                      >
                        <Upload size={16} />
                        Replace
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={(e) => handleFileSelect(e, slot)}
                          disabled={isUploading || isDeleting}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => handleDeleteImage(slot)}
                        disabled={isDeleting || isUploading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <label
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-sm"
                    >
                      <Camera size={16} />
                      Upload
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={(e) => handleFileSelect(e, slot)}
                        disabled={isUploading || isDeleting}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Tips:</strong> Images will be automatically compressed to reduce file size. For best
          results, use JPG or PNG format. Maximum file size: 10MB.
        </p>
      </div>
    </div>
  );
}

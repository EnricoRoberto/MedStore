interface Thumbnail {
  id: string;
  dataUrl: string;
}

export function PhotoThumbnails({ photos }: { photos: Thumbnail[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {photos.map((photo) => (
        <img
          key={photo.id}
          src={photo.dataUrl}
          alt=""
          className="h-16 w-16 rounded-xl border border-stone-200 object-cover"
        />
      ))}
    </div>
  );
}

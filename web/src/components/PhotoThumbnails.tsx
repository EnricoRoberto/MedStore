interface Thumbnail {
  id: string;
  downloadURL: string;
}

export function PhotoThumbnails({ photos }: { photos: Thumbnail[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {photos.map((photo) => (
        <img
          key={photo.id}
          src={photo.downloadURL}
          alt=""
          className="h-16 w-16 rounded-md border border-slate-200 object-cover"
        />
      ))}
    </div>
  );
}

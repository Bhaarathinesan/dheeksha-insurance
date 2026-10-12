import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = `${title} | Dheeksha Insurance`;
  }, [title]);
};

export default useDocumentTitle;

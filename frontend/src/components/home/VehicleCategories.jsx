import React from 'react';
import Container from '../layout/Container';
import ImageCard from '../ui/ImageCard';
import { useTranslation } from '../../i18n';

const VehicleCategories = () => {
  const { t } = useTranslation();

  const categories = [
    {
      title: t('vehicleCategories.twoWheelerTitle'),
      description: t('vehicleCategories.twoWheelerDesc'),
      image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=600&auto=format&fit=crop"
    },
    {
      title: t('vehicleCategories.privateVehicleTitle'),
      description: t('vehicleCategories.privateVehicleDesc'),
      image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=600&auto=format&fit=crop"
    },
    {
      title: t('vehicleCategories.commercialVehicleTitle'),
      description: t('vehicleCategories.commercialVehicleDesc'),
      image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=600&auto=format&fit=crop"
    },
    {
      title: t('vehicleCategories.heavyVehicleTitle'),
      description: t('vehicleCategories.heavyVehicleDesc'),
      image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=600&auto=format&fit=crop"
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-brand-darkBg transition-colors duration-300">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-h2 md:text-h1 text-brand-navy dark:text-text-darkPrimary font-bold mb-4">
            {t('vehicleCategories.title')}
          </h2>
          <p className="text-text-secondary dark:text-text-darkSecondary text-base md:text-lg leading-relaxed">
            {t('vehicleCategories.description')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {categories.map((category, index) => (
            <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <ImageCard 
                title={category.title}
                description={category.description}
                imageSrc={category.image}
                className="h-full"
              />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default VehicleCategories;

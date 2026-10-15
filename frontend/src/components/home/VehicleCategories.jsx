import React from 'react';
import Container from '../layout/Container';
import SectionHeading from '../ui/SectionHeading';
import ImageCard from '../ui/ImageCard';

const VehicleCategories = () => {
  const categories = [
    {
      title: "Two-Wheeler",
      description: "Insurance assistance for bikes and scooters.",
      image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=600&auto=format&fit=crop"
    },
    {
      title: "Private Vehicle",
      description: "Guidance for personal cars and private vehicles.",
      image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=600&auto=format&fit=crop"
    },
    {
      title: "Commercial Vehicle",
      description: "Insurance assistance for vehicles used for commercial purposes.",
      image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=600&auto=format&fit=crop"
    },
    {
      title: "Heavy Vehicle",
      description: "Support for trucks, lorries and other heavy vehicles.",
      image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=600&auto=format&fit=crop"
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-brand-darkBg transition-colors duration-300">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-h2 md:text-h1 text-brand-navy dark:text-text-darkPrimary font-bold mb-4">
            Insurance Assistance for Every Vehicle
          </h2>
          <p className="text-text-secondary dark:text-text-darkSecondary text-base md:text-lg leading-relaxed">
            Dheeksha assists customers across different road-vehicle categories.
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

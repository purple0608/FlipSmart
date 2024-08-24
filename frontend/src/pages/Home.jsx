import React from 'react';
import Header from '../components/Header';
import Slider from '../components/Slider';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import AiAssistantButton from '../components/AiAssistantButton';

const Home = () => {
  return (
    <div className="bg-white overflow-x-hidden">
      <Header />
      <Slider />
      <div className="container mx-auto mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProductCard
          title="Product 1"
          price="$99"
          rating="4.5/5"
          description="High-quality product with excellent features."
          imgSrc="product1.webp"
        />
        <ProductCard
          title="Product 2"
          price="$199"
          rating="4.0/5"
          description="Affordable and reliable."
          imgSrc="product2.webp"
        />
        <ProductCard
          title="Product 3"
          price="$299"
          rating="4.7/5"
          description="Premium product with top-notch performance."
          imgSrc="product3.webp"
        />
        <ProductCard
          title="Product 4"
          price="$399"
          rating="4.8/5"
          description="Luxury item with exceptional quality."
          imgSrc="product4.webp"
        />
        <ProductCard
          title="Product 5"
          price="$99"
          rating="4.5/5"
          description="High-quality product with excellent features."
          imgSrc="product5.webp"
        />
        <ProductCard
          title="Product 6"
          price="$199"
          rating="4.0/5"
          description="Affordable and reliable."
          imgSrc="product6.webp"
        />
        <ProductCard
          title="Product 7"
          price="$299"
          rating="4.7/5"
          description="Premium product with top-notch performance."
          imgSrc="product7.webp"
        />
        <ProductCard
          title="Product 8"
          price="$399"
          rating="4.8/5"
          description="Luxury item with exceptional quality."
          imgSrc="product8.webp"
        />
      </div>
      <Footer />
      <AiAssistantButton />
    </div>
  );
};

export default Home;

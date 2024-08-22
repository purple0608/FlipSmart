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
        <ProductCard title="Product 1" price="$99" imgSrc="product1.webp" />
        <ProductCard title="Product 2" price="$199" imgSrc="product2.webp" />
        <ProductCard title="Product 3" price="$299" imgSrc="product3.webp" />
        <ProductCard title="Product 4" price="$399" imgSrc="product4.webp" />
        <ProductCard title="Product 1" price="$99" imgSrc="product5.webp" />
        <ProductCard title="Product 2" price="$199" imgSrc="product6.webp" />
        <ProductCard title="Product 3" price="$299" imgSrc="product7.webp" />
        <ProductCard title="Product 4" price="$399" imgSrc="product8.webp" />
      </div>
      <Footer />
      <AiAssistantButton />
    </div>
  );
};

export default Home;

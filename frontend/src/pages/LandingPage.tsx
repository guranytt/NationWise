import HeroSection from '../components/landing/HeroSection';
import StatsBar from '../components/landing/StatsBar';
import FeatureSections from '../components/landing/FeatureSections';
import CategoriesGrid from '../components/landing/CategoriesGrid';
import CTABanner from '../components/landing/CTABanner';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <FeatureSections />
      <CategoriesGrid />
      <CTABanner />
    </>
  );
}

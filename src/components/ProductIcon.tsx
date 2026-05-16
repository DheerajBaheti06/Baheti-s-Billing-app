import React from 'react';
import { 
  Shapes, 
  Flame, 
  Sun, 
  Disc, 
  Container, 
  Package,
  LucideProps
} from 'lucide-react';

interface ProductIconProps extends LucideProps {
  category: string;
}

export const ProductIcon: React.FC<ProductIconProps> = ({ category, ...props }) => {
  switch (category) {
    case 'नमकीन':
      return <Shapes {...props} />;
    case 'मसाले':
      return <Flame {...props} />;
    case 'आम पापड़':
      return <Sun {...props} />;
    case 'पापड़':
      return <Disc {...props} />;
    case 'अचार':
      return <Container {...props} />;
    default:
      return <Package {...props} />;
  }
};

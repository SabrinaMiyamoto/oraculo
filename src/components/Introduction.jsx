import { Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';

const Introduction = () => {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      sx={{
        textAlign: 'left',
        background: 'linear-gradient(to bottom, rgba(10,4,16,0.8), rgba(30,15,42,0.9))',
        borderRadius: '8px',
        p: 4,
        margin: '0.75rem auto',
        width:'calc(100% - 2rem)',
        maxWidth: '800px',
        boxShadow: '0 0 20px rgba(150, 0, 24, 0.3)',
        border: '1px solid rgba(255, 215, 0, 0.1)',
      }}
    >
      <Typography 
        variant="h3" 
        component="h1" 
        gutterBottom       
        sx={{
          textAlign: 'center',
          px: 3,
          py: 4,
          color: '#FFD700',
          textShadow: `
            0 0 5px #FFD700,
            0 0 10px rgba(255, 215, 0, 0.5),
            0 0 20px rgba(150, 0, 24, 0.5)
          `,
          letterSpacing: '1px',
          fontFamily: '"Playfair Display", serif',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100px',
            height: '2px',
            background: 'linear-gradient(to right, transparent, #FFD700, transparent)',
          }
        }}
      >
        Yá Bete de Odé
      </Typography>

      <Typography
        variant="body1"
        sx={{
          fontSize: '1.1rem',
          lineHeight: 1.8,
          maxWidth: '700px',
          mx: 'auto',
         
        }}
      >
        Com uma trajetória marcada pela dedicação e respeito ao sagrado, Yá Bete de Odé é uma mãe de santo que, com sabedoria e amor, dedica sua vida à prática espiritual. Atuante e fiel aos ensinamentos de sua tradição, ela compartilha seu conhecimento com profundidade e compromisso, guiando aqueles que buscam orientação e paz. Filha de Exu Veludo e Pombagira Sete Saias, seu trabalho transcende a espiritualidade, tocando corações e transformando vidas.
      </Typography>
    </Box>
  );
};

export default Introduction;
INSERT INTO Product (id,name,slug,description,price,image,stock,category,createdAt,updatedAt) VALUES
 ('seed-brigadeiro','Brigadeiro','brigadeiro','Tradicional brigadeiro com granulado.',200,'/products/brigadeiro.png',20,'doces',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('seed-coxinha','Coxinha','coxinha','Coxinha de frango cremosa.',1500,'/products/coxinhas.png',20,'salgados',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('seed-brigadeiro-gourmet','Brigadeiro gourmet','brigadeiro-gourmet','Brigadeiro com chocolate belga.',400,'/products/brigadeiro.png',30,'doces',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('seed-bolo-red-velvet','Bolo Red Velvet','bolo-red-velvet','Bolo red velvet com cobertura cremosa.',5500,'/products/heroism.png',10,'bolos',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('seed-torta-limao','Torta de Limao','torta-limao','Torta de limao com merengue.',4800,'/products/divinefavor.png',8,'tortas',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('seed-brownie','Brownie recheado','brownie-recheado','Brownie de chocolate com recheio cremoso.',3500,'/products/ilustrativo.png',15,'doces',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

INSERT INTO Coupon (id,code,type,value,minValue,expiresAt,usageLimit,usedCount,active,createdAt,updatedAt) VALUES
 ('seed-coupon-1','BEMVINDO10','PERCENT',10,5000,NULL,NULL,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('seed-coupon-2','FRETEGRATIS','FIXED',2500,30000,NULL,NULL,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('seed-coupon-3','VEMDOCARAMELO','PERCENT',15,8000,NULL,NULL,0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- Conta inicial de exemplo (dados ficticios)
INSERT INTO OwnerAccount (id,name,phone,passwordHash,passwordSalt,createdAt,updatedAt)
SELECT 'owner-seed','Dona Exemplo','login-demo-123','f225abd44d78408a9e78d970e0736aec2f028b0eb93f971af87f70009c8f3cc2','segredo-demo-2025',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM OwnerAccount LIMIT 1);

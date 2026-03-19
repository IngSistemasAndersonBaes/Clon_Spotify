create database db_inv_ti;
use db_inv_ti;

create table areas(
    area varchar(100) primary key
);

create table estados_equipo(
    estado varchar(50) primary key
);

create table usuarios(
    usuario varchar(20) primary key,
    contrasena varchar(255) not null,
    nombre varchar(200) not null,
    area varchar(100) not null,
    correo varchar(50) null,
    estado varchar(15) not null,
    rol varchar(20) not null default 'trabajador',
    token_version int not null default 0
);

create table equipos(
    num_serie varchar(50) primary key,
    equipo varchar(100) not null,
    area varchar(100) not null,
    descripcion text,
    estado varchar(50) not null,
    responsable varchar(20) null,
    fecha_adquisicion date not null,
    fecha_asignacion date not null,
    fecha_baja date not null
);

create table historial_mantenimientos(
    id_historial varchar(100) primary key,
    num_serie varchar(50) not null,
    fecha_reporte date not null,
    fecha_solucion date null,
    usuario_tecnico varchar(20) null,
    falla text not null,
    solucion text null
);

create table productos(
    codigo varchar(50) primary key,
    nom_producto varchar(100) not null,
    desc_producto text not null,
    pre_publico double not null,
    pre_proveedor double not null,
    existencias int not null
);

create table ventas(
    id_venta varchar(150) primary key,
    productos text not null,
    total_venta double not null,
    fecha_venta date not null,
    vendedor varchar(20) not null
);

create table audit_logs(
    id int auto_increment primary key,
    usuario varchar(20) null,
    rol varchar(20) null,
    metodo varchar(10) not null,
    ruta varchar(200) not null,
    status int not null,
    ip varchar(45) null,
    creado_en timestamp default current_timestamp
);

insert into areas (area) values
('Tecnologia'),
('Administracion'),
('Recursos Humanos'),
('Finanzas'),
('Soporte'),
('Almacen'),
('Ventas');

INSERT INTO productos (codigo, nom_producto, desc_producto, pre_publico, pre_proveedor, existencias) VALUES
('H001', 'Detergente Líquido 4.65L', 'Detergente líquido para ropa con poder quitamanchas, presentación familiar', 189.00, 150.00, 60),
('H002', 'Papel Higiénico Rollos', 'Papel higiénico doble hoja, ultra suave, paquete económico', 189.00, 150.00, 100),
('H003', 'Limpiador Multiusos', 'Limpiador multiusos con aroma a lavanda, ideal para pisos y superficies', 35.00, 20.00, 75),
('H004', 'Esponjas Multiusos Pack x3', 'Esponjas multiusos resistentes para cocina y baño', 28.00, 18.00, 80),
('H005', 'Trapeador Palo', 'Trapeador ultra absorbente con cabezal giratorio', 75.00, 50.00, 35),
('H006', 'Vasos x6', 'Vasos resistentes y elegantes para bebidas frias', 95.00, 70.00, 20),
('H007', 'Sartén Antiadherente', 'Sartén de aluminio con recubrimiento antiadherente y mango ergonómico', 120.00, 8.00, 15),
('H008', 'Aromatizante Canela 275g', 'Aerosol aromatizante para el hogar', 32.00, 22.00, 50),
('H009', 'Basurero 25L', 'Contenedor de plástico resistente con pedal y tapa hermética', 110.00, 80.00, 10),
('H010', 'Toallas Reutilizables x3', 'Toallas de tela absorbente reutilizables para cocina', 48.00, 30.00, 45);

insert into estados_equipo (estado) values
('activo'),
('mantenimiento'),
('baja'),
('inactivo'),
('reservado');

INSERT INTO equipos (num_serie, equipo, area, descripcion, estado, responsable, fecha_adquisicion, fecha_asignacion, fecha_baja) VALUES
('E001', 'Laptop Dell XPS 13', 'tecnologia', 'Laptop de alto rendimiento para desarrollo', 'activo', 'Carlos Rodriguez', '2023-01-01', '2023-01-01', '1900-01-01'),
('E002', 'Monitor Samsung 27"', 'tecnologia', 'Monitor 4K de 27 pulgadas', 'activo', NULL, '2023-01-01', '2023-01-01', '1900-01-01'),
('E003', 'Impresora HP LaserJet', 'administracion', 'Impresora multifuncional blanco y negro', 'mantenimiento', 'Juan Perez', '2023-02-15', '2023-02-20', '1900-01-01'),
('E004', 'Router Cisco', 'redes', 'Router empresarial para oficina central', 'activo', NULL, '2023-03-10', '2023-03-15', '1900-01-01'),
('E005', 'Servidor Dell PowerEdge', 'sistemas', 'Servidor de base de datos', 'activo', 'Pedro Sanchez', '2022-11-20', '2022-12-01', '1900-01-01'),
('E006', 'Tablet iPad Pro', 'ventas', 'Tablet para presentaciones comerciales', 'inactivo', 'Laura Lopez', '2023-04-05', '2023-04-10', '2023-12-15'),
('E007', 'Teclado mecánico Logitech', 'tecnologia', 'Teclado gaming para programación', 'activo', NULL, '2023-05-12', '2023-05-15', '1900-01-01'),
('E008', 'Switch Netgear 24 puertos', 'redes', 'Switch gestionable para rack', 'reservado', 'Sofia Diaz', '2023-06-18', '1900-01-01', '1900-01-01'),
('E009', 'Disco duro externo 2TB', 'marketing', 'Almacenamiento para backups', 'baja', NULL, '2022-08-22', '2022-09-01', '2023-10-30'),
('E010', 'Proyector Epson', 'sala juntas', 'Proyector 4K para presentaciones', 'mantenimiento', 'Elena Torres', '2023-07-07', '2023-07-10', '1900-01-01');

INSERT INTO usuarios (usuario, contrasena, nombre, area, correo, estado, rol) VALUES
('crod', '12345', 'Carlos Rodriguez', 'Tecnologia', 'carlos.rodriguez@empresa.com', 'activo', 'administrador'),
('jperez', 'abcde', 'Juan Perez', 'Administracion', 'juan.perez@empresa.com', 'activo', 'trabajador'),
('llopez', 'pass123', 'Laura Lopez', 'Ventas', 'laura.lopez@empresa.com', 'inactivo', 'trabajador'),
('sdiaz', 'clave99', 'Sofia Diaz', 'Soporte', 'sofia.diaz@empresa.com', 'reservado', 'trabajador'),
('etorres', 'qwerty', 'Elena Torres', 'Recursos Humanos', 'elena.torres@empresa.com', 'mantenimiento', 'trabajador'),
('psanchez', 'pw2023', 'Pedro Sanchez', 'Finanzas', 'pedro.sanchez@empresa.com', 'activo', 'trabajador');

INSERT INTO historial_mantenimientos (id_historial, num_serie, fecha_reporte, fecha_solucion, usuario_tecnico, falla, solucion) VALUES
('HIST001', 'E003', '2023-03-01', '2023-03-05', 'crod', 'Atasco de papel en impresora', 'Se realizó limpieza interna y reemplazo de rodillo'),
('HIST002', 'E010', '2023-08-01', '2023-08-03', 'jperez', 'Proyector no enciende', 'Cambio de lámpara y revisión de fuente de poder'),
('HIST003', 'E002', '2023-05-20', '2023-05-22', 'psanchez', 'Pantalla con píxeles muertos', 'Se gestionó garantía y reemplazo del panel'),
('HIST004', 'E006', '2023-12-10', '2023-12-15', 'llopez', 'Tablet no carga batería', 'Reemplazo de batería y actualización de firmware'),
('HIST005', 'E008', '2023-07-01', '2023-07-04', 'sdiaz', 'Switch presenta desconexiones aleatorias', 'Actualización de firmware y cambio de cables defectuosos');

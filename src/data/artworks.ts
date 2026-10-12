import CoffeeTable from "../assets/art/coffeetable.jpg";
import FilmLandscape1 from "../assets/art/film_landscape1.jpg";
import FilmLandscape2 from "../assets/art/film_landscape2.jpeg";
import FilmLandscape3 from "../assets/art/film_landscape3.jpeg";
import FilmLandscape4 from "../assets/art/film_landscape4.jpeg";
import FilmGriffith from "../assets/art/film_griffith.jpeg";
import FilmBuilding from "../assets/art/film_building.jpeg";
import FilmFlowers from "../assets/art/film_flowers.jpg";
import FilmBhai from "../assets/art/film_bhai.jpg";
import FilmCalfAndMom from "../assets/art/film_calfandmom.jpg";
import FilmCamelRock from "../assets/art/film_camelrock.jpg";
import FilmFire from "../assets/art/film_fire.jpg";
import FilmMoirePattern from "../assets/art/film_moirepattern.jpg";
import FilmRockBuilding from "../assets/art/film_rockbuilding.jpg";
import FilmSmileTower from "../assets/art/film_smiletower.jpg";
import FilmSunsetSticks from "../assets/art/film_sunsetsticks.jpeg";

export interface Artwork {
  title: string;
  medium: string;
  description: string;
  imageUrl: string;
  dateCreated: string;
}

export const artworks: Artwork[] = [
  {
    title: "Sticks at Sunset, Moonrise",
    medium: "Film photography",
    description: "The moon, a stand of sticks, and their shadows at sunset.",
    imageUrl: FilmSunsetSticks,
    dateCreated: "2024-01-20",
  },
  {
    title: "Rock Building",
    medium: "Film photography",
    description: "A building made of stacked rock.",
    imageUrl: FilmRockBuilding,
    dateCreated: "2024-01-19",
  },
  {
    title: "Camel Rock",
    medium: "Film photography",
    description: "A rock formation shaped like a camel.",
    imageUrl: FilmCamelRock,
    dateCreated: "2024-01-18",
  },
  {
    title: "Calf and Mother",
    medium: "Film photography",
    description: "A calf and its mother standing in the same pose.",
    imageUrl: FilmCalfAndMom,
    dateCreated: "2024-01-16",
  },
  {
    title: "Smile Tower",
    medium: "Film photography",
    description: "A water tower painted with a big smile.",
    imageUrl: FilmSmileTower,
    dateCreated: "2024-01-15",
  },
  {
    title: "Film Burn at the Fire Station",
    medium: "Film photography",
    description:
      "The first frame of the roll, burned at the edge: the Lincoln fire station, with a phone booth on the roof.",
    imageUrl: FilmFire,
    dateCreated: "2024-01-15",
  },
  {
    title: "Moiré",
    medium: "Film photography",
    description: "A moiré pattern appearing inside a shadow.",
    imageUrl: FilmMoirePattern,
    dateCreated: "2023-08-18",
  },
  {
    title: "Baháʼí Temple in Fog",
    medium: "Film photography",
    description: "The Baháʼí House of Worship on a foggy day.",
    imageUrl: FilmBhai,
    dateCreated: "2023-02-10",
  },
  {
    title: "Recycled Wood Coffee Table",
    medium: "Woodwork",
    description: "A coffee table built from an old bed frame.",
    imageUrl: CoffeeTable,
    dateCreated: "2022-04-10",
  },
  {
    title: "Landscape II",
    medium: "Film photography",
    description: "Landscape study.",
    imageUrl: FilmLandscape2,
    dateCreated: "2021-11-15",
  },
  {
    title: "Landscape III",
    medium: "Film photography",
    description: "Landscape study.",
    imageUrl: FilmLandscape3,
    dateCreated: "2021-09-20",
  },
  {
    title: "Landscape IV",
    medium: "Film photography",
    description: "Landscape study.",
    imageUrl: FilmLandscape4,
    dateCreated: "2021-07-05",
  },
  {
    title: "Building",
    medium: "Film photography",
    description: "Architectural study.",
    imageUrl: FilmBuilding,
    dateCreated: "2021-03-15",
  },
  {
    title: "Landscape I",
    medium: "Film photography",
    description: "Landscape study.",
    imageUrl: FilmLandscape1,
    dateCreated: "2021-02-28",
  },
  {
    title: "Flowers",
    medium: "Film photography",
    description: "Bright flowers.",
    imageUrl: FilmFlowers,
    dateCreated: "2018-08-30",
  },
  {
    title: "Griffith Observatory",
    medium: "Film photography",
    description: "Griffith Observatory, Los Angeles.",
    imageUrl: FilmGriffith,
    dateCreated: "2017-04-18",
  },
].sort(
  (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
);

export const mediums = Array.from(new Set(artworks.map((a) => a.medium)));

export const formatArtDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

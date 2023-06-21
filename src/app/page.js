"use client";
import { Button, Grid, Stack } from "@mui/material";
import GridTiles from '../components/GridTiles';
import Header from "../components/Header";

export default function Home() {
  return (
    <Grid container 
      display='flex'
      height="42vh" 
      alignItems="center" 
      justifyContent="center" 
      flexDirection="column">
      <Header/>
      <GridTiles />
    </Grid>
  );
}

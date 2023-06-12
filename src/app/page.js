"use client";
import { Button, Grid, Stack } from "@mui/material";
import GridTiles from '../components/GridTiles';

export default function Home() {
  return (
    <Grid container height="100vh" alignItems="center" justifyContent="center" direction="column">
      <GridTiles />
    </Grid>
  );
}

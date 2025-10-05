
export function getMeteorData(meteorDiameter, meteorUnits, meteorDesity, velocity, velocityUnit, angle, waterHeight) {
  /*
    Meteor Diameter em int, e o meteor Units em m, km, ft, miles
    Meteor Density from 1000 to 8000 kg/m3
    Velocity 
    Velocity Unit km/s or miles/s
    Impact Angle in degress
    WaterHeight if in solo = -1 else the height of water
    */

  console.log(meteorDiameter * meteorDesity * velocity *  angle ** 0.05);

  let mUnits = -1
  if(meteorUnits === -1)
    return -1;
  if(meteorUnits === "km")
  {
    meteorDiameter *= 1000;
  }
  else if(meteorUnits === "ft")
  {
    meteorDiameter *= 0.3048;
  }
  else if(meteorUnits === "miles")
  {
    meteorDiameter *= 1609.34;
  }


  if(velocityUnit === 'km/s')
  {
    velocity *= 1000;
  }
  if(velocityUnit === 'miles/s')
  {
    velocity *= 1609.34; 
  }

  let soilDesity = 2500;

  if(waterHeight > -1){
    soilDesity = 1000;
  }

  let diametroCrateraTransiente = 1.161 * ((meteorDesity/soilDesity)**(1/3) * (meteorDiameter**0.78) * (velocity**0.44) * (9.81 ** (-0.22)) * (Math.sin(angle * Math.PI / 180) ** (1/3)));
  let profundidadeCrateraTrasiente = diametroCrateraTransiente / (8**(0.5));

  console.log(diametroCrateraTransiente, profundidadeCrateraTrasiente);

  return {diametroCrateraTransiente, profundidadeCrateraTrasiente};
};

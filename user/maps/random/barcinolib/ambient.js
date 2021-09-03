

function setAmbient(biome)
{
    switch (biome)
    {
        case "generic/arctic":
        {
            setSkySet("sunset 1");
            setSunRotation(randomAngle());
            setSunColor(0.8, 0.7, 0.6);
            setAmbientColor(0.7, 0.6, 0.7);
            setSunElevation(Math.PI * randFloat(1/12, 1/7));
            setWaterColor(0, 0.047, 0.286);
            setWaterTint(0.462, 0.756, 0.866);
            setWaterMurkiness(0.92);
            setWaterWaviness(1);
            setWaterType("clap");
        }
        break;
        case "generic/sahara":
        {
            print("*****+* setting amient desert ******");
            setWindAngle(-0.43);
            setWaterTint(0.161, 0.286, 0.353);
            setWaterColor(0.129, 0.176, 0.259);
            setWaterWaviness(8);
            setWaterMurkiness(0.87);
            setWaterType("ocean");
            
            setAmbientColor(0.58, 0.443, 0.353);
            
            setSunColor(0.733, 0.746, 0.574);
            setSunRotation(Math.PI * 1.1);
            setSunElevation(Math.PI / 7);
            
            setFogFactor(0);
            setFogThickness(0);
            setFogColor(0.69, 0.616, 0.541);
            
            setPPEffect("hdr");
            setPPContrast(0.67);
            setPPSaturation(0.42);
            setPPBloom(0.23);
            
        }
        break;
        case "generic/alpine":
        {
            setSkySet(pickRandom(["cirrus", "cumulus", "sunny"]));
            setSunRotation(randomAngle());
            setSunElevation(Math.PI * randFloat(1/5, 1/3));
            setWaterColor(0.0, 0.047, 0.286);				// dark majestic blue
            setWaterTint(0.471, 0.776, 0.863);				// light blue
            setWaterMurkiness(0.82);
            setWaterWaviness(3.0);
            setWaterType("clap");
        }
        break;
        case "generic/india":
        {
            setSunColor(0.6, 0.6, 0.6);
            setSunElevation(Math.PI / 3);
            
            setWaterColor(0.524,0.734,0.839);
            setWaterTint(0.369,0.765,0.745);
            setWaterWaviness(1.0);
            setWaterType("ocean");
            setWaterMurkiness(0.35);
            
            setFogFactor(0.4);
            setFogThickness(0.2);
            
            setPPEffect("hdr");
            setPPContrast(0.7);
            setPPSaturation(0.65);
            setPPBloom(0.6);
            
            setSkySet("cirrus");
        }
        break;
        case "generic/aegean":
        {
            setWaterColor(0.024, 0.212, 0.024);
            setWaterTint(0.133, 0.725, 0.855);
            setWaterMurkiness(0.8);
            setWaterWaviness(3);
            setFogFactor(0);
            setPPEffect("hdr");
            setPPSaturation(0.51);
            setPPContrast(0.62);
            setPPBloom(0.12);
                       
        }
        case "generic/autumn":
        case "generic/temperate":
        default:
        {
            setWindAngle(-0.589049);
            setWaterTint(0.556863, 0.615686, 0.643137);
            setWaterColor(0.494118, 0.639216, 0.713726);
            setWaterWaviness(8);
            setWaterMurkiness(0.87);
            setWaterType("ocean");
            
            setAmbientColor(0.72, 0.72, 0.82);
            
            setSunColor(0.733, 0.746, 0.574);
            setSunRotation(Math.PI * 0.95);
            setSunElevation(Math.PI / 6);
            
            setSkySet("cumulus");
            setFogFactor(0);
            setFogThickness(0);
            setFogColor(0.69, 0.616, 0.541);
            
            setPPEffect("hdr");
            setPPContrast(0.67);
            setPPSaturation(0.42);
            setPPBloom(0.23);
            
        }
    }
}

function getRandomArbitrary(min, max) 
{
    return Math.random() * (max - min) + min;
}

function randomAmount()
{
    var r = getRandomArbitrary(0, 5);
    print("randomAmount=" + r);
    if (r > 0 && r < 1)
        return "scarce";
    else if (r > 1 && r < 2)
        return "few";
    else if (r > 2 && r < 3)
        return "normal";
    else if (r > 3 && r < 4)
        return "many";
    else if (r > 4 && r < 5)
        return "tons";
    else
        return "normal";
}

function randomSize()
{
    var r = getRandomArbitrary(0, 5);
    print("randomSize=" + r);
    if (r > 0 && r < 1)
        return "tiny";
    else if (r > 1 && r < 2)
        return "small";
    else if (r > 2 && r < 3)
        return "normal";
    else if (r > 3 && r < 4)
        return "big";
    else if (r > 4 && r < 5)
        return "huge";
    else
        return "normal";
}






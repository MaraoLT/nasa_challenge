export default function MeteorImpactSimulator() {

    console.log("Rendering MeteorImpactSimulator component");
    return (
    <iframe
        src="/collision/index.html"
        title="Cesium App"
        style={{
        border: "none",
        width: "100%",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        }}
    />
  );
}
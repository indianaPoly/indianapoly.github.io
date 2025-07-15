import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  imgUrl: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: "개발 이야기를 나누는 과정을 즐깁니다.",
    imgUrl: require("@site/static/img/message.png").default,
    description: (
      <>
        함께 고민하고 문제를 해결하는 것이 개발의 매력이라 생각합니다. <br />
        교내 동아리와 외부 활동을 통해 다양한 시각을 접하며 사고의 깊이를
        더해가고 있습니다.
      </>
    ),
  },
  {
    title: "불편함을 해결하며 성장해갑니다.",
    imgUrl: require("@site/static/img/solution.png").default,
    description: (
      <>
        기술은 결국 사람을 위한 것이라고 생각합니다. <br />
        일상생활에서 발견되는 문제들을 기술적으로 해결할 때 큰 의미를 느낍니다.
      </>
    ),
  },
  {
    title: "가장 중요한 것은 태도라고 생각합니다.",
    imgUrl: require("@site/static/img/attitude.png").default,
    description: (
      <>
        모르는 것을 인정하고 배우려는 자세가 무엇보다 중요하다고 믿습니다.{" "}
        <br />
        익숙하지 않은 분야를 마주했을 때도 스스로 학습하고 적용해보며 시야를
        넓혀가고 있습니다.
      </>
    ),
  },
];

function Feature({ title, imgUrl, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <img
          className={styles.featureSvg}
          style={{
            width: "100px",
            height: "100px",
          }}
          src={imgUrl}
          alt={imgUrl}
        />
      </div>
      <div
        className="text--center padding-horiz--md"
        style={{
          marginTop: "15px",
        }}
      >
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

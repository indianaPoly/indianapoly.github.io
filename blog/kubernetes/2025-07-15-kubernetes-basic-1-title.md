---
title: kubernetes-basic (1)
authors: [hyeonlim]
tags: [TIL, Kubernetes]
---

## Deployment

### 1. RECREATE (재가동 방식: v1 → v2)

특징: 서비스 중단 발생

장점: 설정이 쉬움

비고: 현업에서 가장 흔히 사용되며, 서비스 중단을 감수해야 하는 방식

### 2. RAMPED (Rolling Update)

특징: 순차적으로 연결 시도 → 무중단 서비스 제공

설정 방법:

```yml
type: RollingUpdate

maxSurge: 예) 1 → replicas + maxSurge 만큼 pod 생성 가능

maxUnavailable: 예) 1 → replicas 중 동시에 중단 가능한 pod 수

⇒ 위 2개의 옵션을 통해서 재가동 속도를 제어할 수 있음
```

추가 설정:Sticky session: 버전 간 이동 방지

### 3. Blue / Green 배포

특징: selector의 버전 변경으로 전체 교체

사용 목적:개발 버전을 운영에 바로 반영해야 하는 상황

### 4. Canary 배포

특징: ramped와 유사하지만, 일부 트래픽으로 먼저 안정성 검증 후 전체 이전

설정: replicas: 9(v1), 1(v2) 설정, RouteRule의 route → weight 설정으로 손쉽게 설정 가능

### 5. A/B 테스트

특징 : header, cookie 기반으로 사용자 그룹 분리

사용 목적: UI나 기능 개선의 효과를 확인하고자 할 때 (새로운 UI가 구매율을 높이는지 확인)

설정: match에 header 조건 추가

### 6. Shadow 트래픽 (미러링)

사용 목적: 기존 성능 개선을 위해 (예시 : Monolith → Microservice 구조 전환 시 유용)

설정: mirror 설정으로 실제 요청을 복제하여 테스트 환경으로 전달

---

## Service

쿠버네티스의 서비스는 기본적으로 네트워크이다. (물리적인 것이 아니다.)

(쿠버네티스의 pod가 죽고 다른 노드로 이동하면 IP가 변동이되는데, 쿠버네티스 안에는 규칙 기반의 DNS 서버스가 있다.)

### cluster IP

디폴트 서비스, layer4 => 내부에만 접속이 가능하다.

### Node Port

트래픽이 오면 노드의 특정 포트에 도착하고, 클러스터 IP로 가고 이를 분기 시킨다.

- 개발자들이 확인하기 위해서 주로 사용하고 웬만하면 사용하지 않는다.
- 노드를 만드는 이유는?
  - 트래픽이 몰리는 것을 반응하기 위함이다.
  - 어떤 노드에 규칙을 적용해서 작업하기 위함이다.

### Load Balancer

트래픽이 들어오면 나놈. cluster ip와 다른 점은 cluster ip는 내부에 있고 로드밸런서는 외부에 위치해있다.

### Ingress

외부에 위치에 있음. 로드 밸런서와의 차이점은 로드 밸런서는 layer4이고 Ingress는 layer7이다. (layer1~layer7까지 확인을 해볼 수 있다.)

사용자가 xxx.xxx.xxx.com이 접속을 하면
igw를 통해 ingress(퍼블릭 도메인이 자동 활동, ALB, NLB)에 들어오고 k8s 서비스에 접속이 된다. 첫 번째 껍데기는 replicaset 두 번째 껍데기는 deployment
ingress만 생성하는 것이 아니라 내부 서비스를 생성해야 통신이 된다.

쿠버네티스 안에 LB controller가 ingress를 생성하고, 상태를 감시한다. 그리고 삭제도 해준다.

- ingress를 삭제하고 테라폼을 삭제하는 것이 더 빠르다. ingress는 외부 서비스이기 때문이다.

✅ **왜 ELB IP가 3개 나오는가?**

<img src="/img/blog/kubernetes/2025-07-15/img1.png" alt="설명" width="600" />

AWS에서 Network Load Balancer(NLB)는 **서브넷이 존재하는 모든 가용영역(AZ)** 에 **자동으로
IP를 할당**합니다. 이는 고가용성(High Availability)을 보장하기 위한 기본 동작이다.

1. 서울 리전(`ap-northeast-2`)에서 VPC 생성

- 아래와 같이 **3개의 프라이빗 서브넷 생성**:

```hcl
variable "private_subnet_cidrs" {
  type = map(string)
  default = {
    a = "10.1.4.0/24"  // ap-northeast-2a (8층)
    b = "10.1.5.0/24"  // ap-northeast-2b (9층)
    c = "10.1.6.0/24"  // ap-northeast-2c (10층)
  }
}
```

2. EKS 클러스터 생성

<img src="/img/blog/kubernetes/2025-07-15/img2.png" alt="설명" width="600" />-

EKS클러스터를 생성하면 노드 그룹을 구성 - 노드는 2개에만 배치가 된다.

3. Ingress 생성

- Ingress 리소서를 생성을 하면 AWS에서 NLB 자동 생성
- NLB는 연결된 서브넷에 있는 모든 AZ에 IP를 할당

### Headless service

아래와 같이 설정을 하면 headless service가 된다.

```yml
clusterIP: None
```

Headless를 하면 pod로 가는게 아니라 pod의 backend의 IP주소를 준다.

어디에 쓰는지? 왜 쓰는지?
분산형 데이터 저장 서비스(DB, Messeage Queue, InMemory DB)

1. 클라이언트 연결
2. 몇 개가 살아있는지 확인하기 위해서
3. **특정 노드의 데이터를 확인해야할 때 -> 이게 핵심**

분산형 데이터베이스 (Cassandra, Mongo, Redis)에 저장이 될 때 데이터를 저장하기 위해서는 Hash Algorithm을 쓴다. 이 때 노드에 저장을 하기 위해서는 노드의 정보를 알야아하는데 어를 때 노드의 정보를 반환하기 위해서 Headless를 이용한다.

- Hash Algorithm을 사용할 때 Node의 갯수가 약 10 이상의 소수인 경우에 even하게 값이 분산이 되는 것을 확인할 수 있다.

### volume

docker image layer에 hash 값이 있는 이유는 ?

가상 머신의 디스크를 쓰게 된다면, 하나만 수정해도 전체가 변경이 된다. 이 때 docker 의 layer를 생각을 하면 캐시를 할 수 있다는 점이다. 따라서 변경이 되면 해시 값이 바뀜으로 인해서 변경 사항을 파악 가능하다.

컨테이너가 종료된다면? 다 사라짐.
-> 컨테이너가 종료되어도 데이터를 유지할 수 있는 방법은 외부 디스크 볼륨을 마운트 하는 것입니다.

- EmptyDir: Pod가 종료되면 영구적으로 삭제됩니다. (즉 Pod와 동일한 LifeCycle을 가지게 됩니다.) --> 그런데 왜 쓸까요? 대규모 기반 정렬 작업, Pod 내의 컨테이너 간 파일 교환, 복구를 위한 임시파일 보관하기 위해서 사용을 합니다.

- HostPath: pod가 종료되어도 상태가 유지가 됩니다. 다만 Pod는 항상 다른 노드로 이동 가능성이 존재하기 때문에 에러가 날 수 있다는 문제가 있습니다.

- persistent volume(PV)
  - block disk (노트북 c drive) : 동시에 읽을 수는 있지만, 쓸 수 없습니다. | 순서가 제일 빠릅니다.
  - network file disk(systme) = NFS : 여러 사용자가 접근하여 동시에 쓸 수 있고, 읽을 수 있습니다. | 2순위
  - object dist (aws S3) : 3순위 => 대규모 작업은 여기서 진행을 합니다. 왜 그럴까요? Append only, 파일을 열어서 수정할 수 없습니다. => 왜 그럴까요? 분산 작업에 유리하기 때문입니다. (연산 중에 변경을 하면 처음부터 다시 해야하는데, 이런 작업을 애초에 닫아버립니다.)

---

## 실습

### 1. HTTPD 배포 → 이미지 업데이트 → 롤백 → 삭제

아래 파일 통해서 httpd를 설치한다.

```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: httpd-deployment
  labels:
    app: httpd
spec:
  replicas: 3
  selector:
    matchLabels:
      app: httpd
  template:
    metadata:
      labels:
        app: httpd
    spec:
      containers:
        - name: httpd
          image: httpd:2.4
          ports:
            - containerPort: 80
```

**1. Deployment**

```bash
kubectl apply -f ./deploy-practice.yml
```

- httpd-deployment 라는 이름의 deployment가 생성이 된다.
- POD는 기본 설정에 따라서 적용이 된다.

**2. 변경 사유(Revision 1) 주석(Annotation) 추가**

```bash
kubectl annotate deploy httpd-deployment kubernetes.io/change-cause="first"
```

- 기록에 "first"라는 설명을 추가한다.
- rollout history 에 Revision 1로 기록이 된다.

**3. 이미지 업데이트 및 변경 사유 등록 (Revision 2)**

```bash
kubectl set image deploy httpd-deployment httpd=httpd:latest

kubectl annotate deploy httpd-deployment kubernetes.io/change-cause="update latest"

```

- httpd 컨터이너의 이미지가 httpd:latest로 업데이트가 된다.
- update latest 로 주석 추가가 된다.

**4. 롤아웃 상태 확인 및 파드 확인**

```bash
kubectl rollout status deploy httpd-deployment

kubectl get pods -l app=httpd
```

- 파드가 정상적으로 배포가 된다.

**5. Scale out**

```bash
kubectl scale deploy httpd-deployment --replicas=5
```

- 레플리카 수가 5개로 증가가 된다. 기존에서 2개 추가가 된다.

**6. Rollback**

```bash
kubectl rollout undo deploy httpd-deployment

kubectl annotate deploy httpd-deployment kubernetes.io/change-cause="rollback"
```

- 이전 비전으로 롤백이 진행이 된다.
- 롤백 사유는 rollback으로 기록
